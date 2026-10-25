import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ReservationsPanel from '../../src/components/admin/ReservationsPanel'
import type { EstadoReserva, ReservaDocument } from '../../src/types/reserva'

afterEach(cleanup)

function reservation(
  id: string,
  status: ReservaDocument['estado_reserva'] = 'pendiente',
  date = new Date('2026-05-10T12:00:00'),
): ReservaDocument {
  return {
    id_reserva: id,
    id_usuario: `user-${id}`,
    email_usuario: `${id}@example.com`,
    id_producto: `offer-${id}`,
    fecha_reserva: date,
    cantidad: 2,
    estado_reserva: status,
  }
}

function renderPanel(
  initialReservations: ReservaDocument[] = [reservation('r-1')],
  props: {
    onStatusChange?: (id: string, status: EstadoReserva) => Promise<void>
    onDelete?: (id: string) => Promise<void>
  } = {},
) {
  return render(
    <ReservationsPanel
      initialReservations={initialReservations}
      onStatusChange={props.onStatusChange ?? vi.fn().mockResolvedValue(undefined)}
      onDelete={props.onDelete ?? vi.fn().mockResolvedValue(undefined)}
      {...props}
    />,
  )
}

describe('ReservationsPanel', () => {
  it('combines text, status, and date filters', () => {
    renderPanel([
      reservation('r-1', 'pendiente', new Date('2026-05-10T12:00:00')),
      reservation('r-2', 'confirmada', new Date('2026-05-11T12:00:00')),
    ])

    fireEvent.change(screen.getByLabelText('Buscar reservas'), { target: { value: 'r-1' } })
    fireEvent.change(screen.getByLabelText('Filtrar reservas por estado'), {
      target: { value: 'pendiente' },
    })
    fireEvent.change(screen.getByLabelText('Desde la fecha de reserva'), {
      target: { value: '2026-05-10' },
    })
    fireEvent.change(screen.getByLabelText('Hasta la fecha de reserva'), {
      target: { value: '2026-05-10' },
    })

    expect(screen.getByText('r-1')).toBeTruthy()
    expect(screen.queryByText('r-2')).toBeNull()

    fireEvent.change(screen.getByLabelText('Hasta la fecha de reserva'), {
      target: { value: '2026-05-09' },
    })
    expect(screen.getByText('No hay reservas que coincidan con los filtros.')).toBeTruthy()
  })

  it('paginates reservations and resets the page when filtering', () => {
    renderPanel(Array.from({ length: 10 }, (_, index) => reservation(`r-${index}`)))

    expect(screen.getAllByRole('row')).toHaveLength(9)
    fireEvent.click(screen.getByText('Siguiente'))
    expect(screen.getAllByRole('row')).toHaveLength(3)
    expect(screen.getByText('r-8')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Buscar reservas'), { target: { value: 'r-1' } })
    expect(screen.getByText(/Página 1 de 1/)).toBeTruthy()
  })

  it('confirms a reservation without representing it as inventory returned', async () => {
    const onStatusChange = vi.fn().mockResolvedValue(undefined)
    renderPanel([reservation('r-1')], { onStatusChange })

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reserva r-1' }))
    expect(screen.getByRole('dialog').textContent).toContain('continuará reservado')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmada' }))

    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith('r-1', 'confirmada'))
    expect(screen.getByText('Confirmada', { selector: '.status-badge' })).toBeTruthy()
  })

  it('reports failed status changes and keeps the reservation unchanged', async () => {
    const onStatusChange = vi.fn().mockRejectedValue(new Error('permission denied'))
    renderPanel([reservation('r-1')], { onStatusChange })

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar reserva r-1' }))
    expect(screen.getByRole('dialog').textContent).toContain('inventario reservado se devolverá')
    fireEvent.click(screen.getByRole('button', { name: 'Cancelada' }))

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByText('Pendiente', { selector: '.status-badge' })).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('deletes a reservation only after confirmation', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)
    renderPanel([reservation('r-1')], { onDelete })

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar reserva r-1' }))
    expect(screen.getByRole('dialog').textContent).toContain('inventario')
    expect(onDelete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('r-1'))
    expect(screen.getByText('No hay reservas que coincidan con los filtros.')).toBeTruthy()
  })
})
