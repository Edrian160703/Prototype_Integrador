import { useEffect, useState } from 'react'
import { useReservationAdmin } from '../context/ApplicationContext'
import type { EstadoReserva, ReservaDocument } from '../types/reserva'

export default function useAdminReservations() {
<<<<<<< HEAD
  const { getAllReservasForAdmin, updateReservaEstado, deleteReserva } =
    useReservationAdmin()
=======
  const {
    getAllReservasForAdmin,
    updateReservaEstado,
    deleteReservaForAdmin,
  } = useReservationAdmin()
>>>>>>> rama-diego
  const [reservations, setReservations] = useState<ReservaDocument[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadReservations() {
      try {
        const records = await getAllReservasForAdmin()
        if (active) setReservations(records)
      } catch (error) {
<<<<<<< HEAD
        console.error('No se pudieron cargar las reservas del panel administrativo.', error)
=======
        console.error('No se pudieron cargar las reservas administrativas.', error)
>>>>>>> rama-diego
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
<<<<<<< HEAD
    handleReservationDelete: (id: string) => deleteReserva(id),
=======
    handleReservationDelete: (id: string) => deleteReservaForAdmin(id),
>>>>>>> rama-diego
  }
}
