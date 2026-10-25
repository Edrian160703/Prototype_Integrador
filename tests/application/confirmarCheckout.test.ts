import { describe, expect, it, vi } from 'vitest'
import { confirmarCheckout } from '../../src/application/checkout'
import type { CompraRecorder } from '../../src/ports/compraRepository'
import type { PaymentGateway } from '../../src/ports/paymentGateway'
import type { ReservaCreator, ReservaDeleter } from '../../src/ports/reservaRepository'
import type { CartItem } from '../../src/types/cart'
import type { CheckoutRequest } from '../../src/types/checkout'

const items = [
  { id: 'oferta-1', price: 4, quantity: 2 },
  { id: 'oferta-2', price: 10, quantity: 1 },
] as unknown as CartItem[]

const customer = { nombre: 'Ana García', dni: '12345678', telefono: '987654321' }
const card = { number: '4111111111111111', expiry: '12/30', cvv: '123' }

function setup() {
  const reservations: ReservaCreator & ReservaDeleter = {
    create: vi.fn().mockResolvedValueOnce('reserva-1').mockResolvedValueOnce('reserva-2'),
    delete: vi.fn().mockResolvedValue(undefined),
  }
  const payments: PaymentGateway = {
    charge: vi.fn().mockResolvedValue({ reference: 'pago-1' }),
    refund: vi.fn().mockResolvedValue(undefined),
  }
  return { reservations, payments }
}

describe('confirmarCheckout', () => {
  it('pago en tienda: reserva con estado PENDIENTE_PAGO_TIENDA, guarda el DNI y no cobra', async () => {
    const { reservations, payments } = setup()
    const request: CheckoutRequest = { customer, metodoPago: 'tienda' }

    await expect(confirmarCheckout(reservations, payments, 'user-1', 'ana@mail.com', items, request, 'ana'))
      .resolves.toEqual(['reserva-1', 'reserva-2'])

    expect(payments.charge).not.toHaveBeenCalled()
    expect(reservations.create).toHaveBeenNthCalledWith(1, 'user-1', 'ana@mail.com', items[0], 'ana', {
      nombre_cliente: 'Ana García',
      dni_cliente: '12345678',
      telefono_cliente: '987654321',
      metodo_pago: 'tienda',
      estado_pago: 'PENDIENTE_PAGO_TIENDA',
    })
  })

  it('pago online: cobra el total, reserva con estado PAGADO y guarda el DNI', async () => {
    const { reservations, payments } = setup()

    await confirmarCheckout(reservations, payments, 'user-1', 'ana@mail.com', items, {
      customer,
      metodoPago: 'online',
      card,
    })

    expect(payments.charge).toHaveBeenCalledWith({ amount: 18, card })
    expect(reservations.create).toHaveBeenNthCalledWith(2, 'user-1', 'ana@mail.com', items[1], undefined, {
      nombre_cliente: 'Ana García',
      dni_cliente: '12345678',
      telefono_cliente: '987654321',
      metodo_pago: 'online',
      estado_pago: 'PAGADO',
      referencia_pago: 'pago-1',
    })
  })

  it('no hace nada si el DNI no tiene 8 dígitos', async () => {
    const { reservations, payments } = setup()

    await expect(confirmarCheckout(reservations, payments, 'user-1', 'ana@mail.com', items, {
      customer: { ...customer, dni: '1234567' },
      metodoPago: 'online',
      card,
    })).rejects.toThrow('El DNI debe tener exactamente 8 dígitos.')

    expect(payments.charge).not.toHaveBeenCalled()
    expect(reservations.create).not.toHaveBeenCalled()
  })

  it('si el cobro es rechazado no crea reservas', async () => {
    const { reservations, payments } = setup()
    payments.charge = vi.fn().mockRejectedValue(new Error('El banco rechazó el pago.'))

    await expect(confirmarCheckout(reservations, payments, 'user-1', 'ana@mail.com', items, {
      customer,
      metodoPago: 'online',
      card,
    })).rejects.toThrow('El banco rechazó el pago.')

    expect(reservations.create).not.toHaveBeenCalled()
  })

  it('si una reserva falla después del cobro, cancela las creadas y reembolsa', async () => {
    const { reservations, payments } = setup()
    reservations.create = vi.fn()
      .mockResolvedValueOnce('reserva-1')
      .mockRejectedValueOnce(new Error('No hay suficientes unidades disponibles.'))

    await expect(confirmarCheckout(reservations, payments, 'user-1', 'ana@mail.com', items, {
      customer,
      metodoPago: 'online',
      card,
    })).rejects.toThrow('No hay suficientes unidades disponibles.')

    expect(reservations.delete).toHaveBeenCalledWith('reserva-1')
    expect(payments.refund).toHaveBeenCalledWith('pago-1')
  })

  it('registra la compra con todas las reservas, el total y el estado de pago', async () => {
    const { reservations, payments } = setup()
    const purchases: CompraRecorder = { record: vi.fn().mockResolvedValue('COMPRA_ana_12345678') }
    const named = [
      { id: 'oferta-1', title: 'Pay', place: 'TOTUS', price: 4, quantity: 2 },
      { id: 'oferta-2', title: 'Torta', place: 'TOTUS', price: 10, quantity: 1 },
    ] as unknown as CartItem[]

    await confirmarCheckout(reservations, payments, 'user-1', 'ana@mail.com', named, {
      customer,
      metodoPago: 'tienda',
    }, 'Ana', purchases)

    expect(purchases.record).toHaveBeenCalledWith({
      idUsuario: 'user-1',
      emailUsuario: 'ana@mail.com',
      nombreUsuario: 'Ana',
      customer,
      metodoPago: 'tienda',
      estadoPago: 'PENDIENTE_PAGO_TIENDA',
      referenciaPago: undefined,
      total: 18,
      items: [
        { id_reserva: 'reserva-1', id_oferta: 'oferta-1', nombre_producto: 'Pay', comercio: 'TOTUS', cantidad: 2, precio_unitario: 4, subtotal: 8 },
        { id_reserva: 'reserva-2', id_oferta: 'oferta-2', nombre_producto: 'Torta', comercio: 'TOTUS', cantidad: 1, precio_unitario: 10, subtotal: 10 },
      ],
    })
  })

  it('si no se puede registrar la compra, cancela las reservas y reembolsa', async () => {
    const { reservations, payments } = setup()
    const purchases: CompraRecorder = { record: vi.fn().mockRejectedValue(new Error('Sin permisos.')) }

    await expect(confirmarCheckout(reservations, payments, 'user-1', 'ana@mail.com', items, {
      customer,
      metodoPago: 'online',
      card,
    }, 'Ana', purchases)).rejects.toThrow('Sin permisos.')

    expect(reservations.delete).toHaveBeenCalledWith('reserva-1')
    expect(reservations.delete).toHaveBeenCalledWith('reserva-2')
    expect(payments.refund).toHaveBeenCalledWith('pago-1')
  })
})
