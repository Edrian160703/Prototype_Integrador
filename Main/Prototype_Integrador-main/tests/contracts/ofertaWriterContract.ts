import { describe, expect, it } from 'vitest'
import type { OfertaWriter } from '../../src/ports/ofertaRepository'
import type { OfertaPayload } from '../../src/types/oferta'

export interface OfertaWriterContractFixture {
  writer: OfertaWriter
  seed(ownerId: string): Promise<string>
  read(id: string): Promise<Record<string, unknown> | null>
}

const editablePayload: Omit<OfertaPayload, 'estado'> = {
  nombre_producto: 'Pan integral',
  id_categoria: 'panaderia',
  descripcion: 'Pan integral recién horneado',
  precio_original: 16,
  precio_oferta: 10,
  cantidad_disponible: 3,
  horario_recojo: '18:00 - 20:00 hs',
  fecha_limite: '2027-05-09T19:00',
  imagen_url: 'https://example.com/pan.jpg',
}

export function runOfertaWriterContract(
  adapterName: string,
  createFixture: () => OfertaWriterContractFixture,
) {
  describe(`${adapterName} cumple el contrato OfertaWriter`, () => {
    it('permite al propietario actualizar los campos editables', async () => {
      const fixture = createFixture()
      const id = await fixture.seed('owner-1')

      await expect(
        fixture.writer.updateOwned(id, 'owner-1', editablePayload),
      ).resolves.toBeUndefined()

      const stored = await fixture.read(id)
      expect(stored).toMatchObject({
        id_comercio: 'owner-1',
        nombre_producto: editablePayload.nombre_producto,
        id_categoria: editablePayload.id_categoria,
        descripcion: editablePayload.descripcion,
        precio_original: editablePayload.precio_original,
        precio_oferta: editablePayload.precio_oferta,
        cantidad_disponible: editablePayload.cantidad_disponible,
        horario_recojo: editablePayload.horario_recojo,
        imagen_url: editablePayload.imagen_url,
      })
    })

    it('rechaza cambios y eliminaciones de un usuario que no es propietario', async () => {
      const fixture = createFixture()
      const id = await fixture.seed('owner-1')

      await expect(fixture.writer.updateOwned(id, 'owner-2', editablePayload))
        .rejects.toThrow('No tienes permiso')
      await expect(fixture.writer.deleteOwned(id, 'owner-2'))
        .rejects.toThrow('No tienes permiso')
      expect(await fixture.read(id)).not.toBeNull()
    })

    it('rechaza cambios y eliminaciones de ofertas inexistentes', async () => {
      const fixture = createFixture()

      await expect(fixture.writer.updateOwned('missing', 'owner-1', editablePayload))
        .rejects.toThrow('No tienes permiso')
      await expect(fixture.writer.deleteOwned('missing', 'owner-1'))
        .rejects.toThrow('No tienes permiso')
    })

    it('permite al propietario eliminar la oferta', async () => {
      const fixture = createFixture()
      const id = await fixture.seed('owner-1')

      await expect(fixture.writer.deleteOwned(id, 'owner-1')).resolves.toBeUndefined()
      expect(await fixture.read(id)).toBeNull()
    })
  })
}
