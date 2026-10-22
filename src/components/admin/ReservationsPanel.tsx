import { useMemo, useState } from 'react'
import type { EstadoReserva, ReservaDocument } from '../../types/reserva'
import {
  matchesCreationDateRange,
  type CreationDateRange,
} from '../../utils/adminDateFilter'
import { filterAdminItems, paginateAdminItems } from '../../utils/adminPanelData'
import { formatRelative } from '../../utils/adminFormatters'
import CreationDateFilter from './CreationDateFilter'
import ConfirmDialog from './ConfirmDialog'

const STATUSES: readonly EstadoReserva[] = [
  'pendiente',
  'confirmada',
  'cancelada',
]

const STATUS_LABELS: Record<EstadoReserva, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
}

const STATUS_CLASSES: Record<EstadoReserva, string> = {
  pendiente: 'status-pendiente',
  confirmada: 'status-activa',
  cancelada: 'status-suspendida',
}

const PAGE_SIZE = 8

type PendingAction =
  | { reservation: ReservaDocument; action: 'delete' }
  | { reservation: ReservaDocument; action: 'status'; status: EstadoReserva }

interface ReservationsPanelProps {
  initialReservations: ReservaDocument[]
  onStatusChange: (id: string, status: EstadoReserva) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onReservationsChange?: (reservations: ReservaDocument[]) => void
}

export default function ReservationsPanel({
  initialReservations,
  onStatusChange,
  onDelete,
  onReservationsChange,
}: ReservationsPanelProps) {
  const [reservations, setReservations] = useState(initialReservations)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | EstadoReserva>('todos')
  const [creationDateRange, setCreationDateRange] =
    useState<CreationDateRange>('todos')
  const [page, setPage] = useState(1)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      filterAdminItems(
        reservations,
        query,
        (reservation) => [
          reservation.id_reserva,
          reservation.email_usuario,
          reservation.id_producto,
        ],
        (reservation) =>
          (statusFilter === 'todos' ||
            reservation.estado_reserva === statusFilter) &&
          matchesCreationDateRange(reservation.fecha_reserva, creationDateRange),
      ),
    [reservations, query, statusFilter, creationDateRange],
  )
  const { pageItems, currentPage, totalPages } = paginateAdminItems(
    filtered,
    page,
    PAGE_SIZE,
  )

  function updateFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(1)
    }
  }

  async function applyAction() {
    if (!pending) return

    setLoading(true)
    setActionError(null)
    try {
      let updated: ReservaDocument[]
      if (pending.action === 'delete') {
        await onDelete(pending.reservation.id_reserva)
        updated = reservations.filter(
          (reservation) =>
            reservation.id_reserva !== pending.reservation.id_reserva,
        )
      } else {
        await onStatusChange(
          pending.reservation.id_reserva,
          pending.status,
        )
        updated = reservations.map((reservation) =>
          reservation.id_reserva === pending.reservation.id_reserva
            ? { ...reservation, estado_reserva: pending.status }
            : reservation,
        )
      }
      setReservations(updated)
      onReservationsChange?.(updated)
      setPending(null)
    } catch (error) {
      console.error('No se pudo actualizar la reserva desde el panel administrativo.', error)
      setActionError('No se pudo completar la acción. Verifica tus permisos e inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-panel-wrap">
      <div className="admin-panel">
        <div className="admin-toolbar">
          <div className="search-field">
            <span aria-hidden="true">🔍</span>
            <input
              value={query}
              onChange={(event) => updateFilter(setQuery)(event.target.value)}
              placeholder="Buscar reserva, consumidor o producto"
              aria-label="Buscar reservas"
            />
          </div>
          <div className="toolbar-filters">
            <CreationDateFilter
              value={creationDateRange}
              onChange={(value) => updateFilter(setCreationDateRange)(value)}
            />
            <select
              aria-label="Filtrar reservas por estado"
              value={statusFilter}
              onChange={(event) =>
                updateFilter(setStatusFilter)(
                  event.target.value as 'todos' | EstadoReserva,
                )
              }
            >
              <option value="todos">Todos los estados</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {actionError && (
          <div className="admin-error-banner" role="alert">
            {actionError}
          </div>
        )}

        <div className="table-wrap">
          <table className="accounts-table">
            <thead>
              <tr>
                <th>Reserva</th>
                <th>Consumidor</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Creada</th>
                <th>Estado</th>
                <th className="col-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((reservation) => (
                <tr key={reservation.id_reserva}>
                  <td>{reservation.id_reserva}</td>
                  <td>{reservation.email_usuario || reservation.id_usuario}</td>
                  <td>{reservation.id_producto}</td>
                  <td>{reservation.cantidad}</td>
                  <td>{formatRelative(reservation.fecha_reserva)}</td>
                  <td>
                    <span
                      className={`status-badge ${STATUS_CLASSES[reservation.estado_reserva]}`}
                    >
                      {STATUS_LABELS[reservation.estado_reserva]}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <select
                        aria-label={`Cambiar estado de la reserva ${reservation.id_reserva}`}
                        value={reservation.estado_reserva}
                        onChange={(event) => {
                          const status = event.target.value as EstadoReserva
                          if (status !== reservation.estado_reserva) {
                            setPending({ reservation, action: 'status', status })
                          }
                        }}
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="icon-btn icon-btn-danger"
                        title="Eliminar reserva"
                        aria-label={`Eliminar reserva ${reservation.id_reserva}`}
                        onClick={() => setPending({ reservation, action: 'delete' })}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-empty">
                    No hay reservas que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          <p>
            Mostrando {pageItems.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
            {(currentPage - 1) * PAGE_SIZE + pageItems.length} de {filtered.length}
          </p>
          <div className="pagination-controls">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              aria-label="Página anterior"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              aria-label="Página siguiente"
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      {pending && (
        <ConfirmDialog
          title={
            pending.action === 'delete'
              ? 'Eliminar reserva'
              : 'Cambiar estado de la reserva'
          }
          message={
            pending.action === 'delete'
              ? `Esta acción es permanente. Se eliminará la reserva ${pending.reservation.id_reserva}.`
              : `La reserva ${pending.reservation.id_reserva} cambiará al estado "${STATUS_LABELS[pending.status]}".`
          }
          confirmLabel="Confirmar"
          variant={pending.action === 'delete' ? 'danger' : 'primary'}
          loading={loading}
          onCancel={() => setPending(null)}
          onConfirm={applyAction}
        />
      )}
    </div>
  )
}
