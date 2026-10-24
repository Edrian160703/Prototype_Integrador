import { useEffect, useState } from 'react'
import { useReservationAdmin } from '../context/ApplicationContext'
import type { EstadoReserva, ReservaDocument } from '../types/reserva'

export default function useAdminReservations() {
  const {
    getAllReservasForAdmin,
    updateReservaEstado,
    deleteReservaForAdmin,
  } = useReservationAdmin()
  const [reservations, setReservations] = useState<ReservaDocument[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadReservations() {
      try {
        const records = await getAllReservasForAdmin()
        if (active) setReservations(records)
      } catch (error) {
        console.error('No se pudieron cargar las reservas administrativas.', error)
        if (active) setLoadError('No pudimos cargar las reservas desde Firestore.')
      }
    }

    void loadReservations()
    return () => {
      active = false
    }
  }, [getAllReservasForAdmin])

  return {
    reservations,
    loadError,
    handleReservationStatusChange: (id: string, status: EstadoReserva) =>
      updateReservaEstado(id, status),
    handleReservationDelete: (id: string) => deleteReservaForAdmin(id),
  }
}
