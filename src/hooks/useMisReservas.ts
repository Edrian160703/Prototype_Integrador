import { useEffect, useState } from 'react'
import { useReservationHistory, useReservationManagement } from '../context/ApplicationContext'
import type { ReservaConOferta } from '../types/reserva'

interface UseMisReservasResult {
  reservas: ReservaConOferta[]
  loading: boolean
  error: string
  cancelandoId: string | null
  errorCancelId: string | null
  reservaAEliminar: ReservaConOferta | null
  selectReservaToDelete: (reserva: ReservaConOferta) => void
  closeDeleteConfirmation: () => void
  confirmDelete: () => Promise<void>
}

export default function useMisReservas(idUsuario: string): UseMisReservasResult {
  const { cancelarReserva } = useReservationManagement()
  const { getReservasByUsuario } = useReservationHistory()
  const [reservas, setReservas] = useState<ReservaConOferta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelandoId, setCancelandoId] = useState<string | null>(null)
  const [errorCancelId, setErrorCancelId] = useState<string | null>(null)
  const [reservaAEliminar, setReservaAEliminar] = useState<ReservaConOferta | null>(null)

  useEffect(() => {
    let cancelled = false

    async function cargar() {
      setLoading(true)
      setError('')
      try {
        const data = await getReservasByUsuario(idUsuario)
        if (!cancelled) setReservas(data)
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : 'No pudimos cargar tus reservas.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void cargar()
    return () => {
      cancelled = true
    }
  }, [getReservasByUsuario, idUsuario])

  const selectReservaToDelete = (reserva: ReservaConOferta) => {
    setReservaAEliminar(reserva)
  }

  const closeDeleteConfirmation = () => {
    if (cancelandoId) return
    setReservaAEliminar(null)
  }

  const confirmDelete = async () => {
    const reserva = reservaAEliminar
    if (!reserva) return

    setErrorCancelId(null)
    setCancelandoId(reserva.id_reserva)
    try {
      await cancelarReserva(reserva.id_reserva)
      setReservas((current) => current.filter((item) => item.id_reserva !== reserva.id_reserva))
      setReservaAEliminar(null)
    } catch (reason) {
      setErrorCancelId(reserva.id_reserva)
      console.error('Error al cancelar la reserva', reason)
      setReservaAEliminar(null)
    } finally {
      setCancelandoId(null)
    }
  }

  return {
    reservas,
    loading,
    error,
    cancelandoId,
    errorCancelId,
    reservaAEliminar,
    selectReservaToDelete,
    closeDeleteConfirmation,
    confirmDelete,
  }
}
