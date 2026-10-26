import { useMemo, useState } from 'react'
import type { EstadoReserva, ReservaDocument } from '../../types/reserva'
import { countAdminStatuses, filterAdminItems, paginateAdminItems } from '../../utils/adminPanelData'
import { formatRelative } from '../../utils/adminFormatters'
import ConfirmDialog from './ConfirmDialog'

const STATUSES: readonly EstadoReserva[] = ['pendiente', 'confirmada', 'cancelada']
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
  | { reservation: ReservaDocument; type: 'status'; status: EstadoReserva }
  | { reservation: ReservaDocument; type: 'delete' }

interface ReservationsPanelProps {
  initialReservations: ReservaDocument[]
  onStatusChange: (id: string, status: EstadoReserva) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function matchesDateRange(date: Date, from: string, to: string): boolean {
  const timestamp = date.getTime()
  if (Number.isNaN(timestamp)) return false
  const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY
  const toTime = to ? new Date(`${to}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY
  return fromTime <= toTime && timestamp >= fromTime && timestamp <= toTime
}

export default function ReservationsPanel({
  initialReservations,
  onStatusChange,
  onDelete,
}: ReservationsPanelProps) {
  const [reservations, setReservations] = useState(initialReservations)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | EstadoReserva>('todos')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const results = filterAdminItems(
      reservations,
      query,
      (reservation) => [
        reservation.id_reserva,
        reservation.id_usuario,
        reservation.email_usuario,
        reservation.id_producto,
      ],
      (reservation) =>
        (statusFilter === 'todos' || reservation.estado_reserva === statusFilter) &&
        matchesDateRange(reservation.fecha_reserva, fromDate, toDate),
    )
    return results.sort((left, right) => right.fecha_reserva.getTime() - left.fecha_reserva.getTime())
  }, [reservations, query, statusFilter, fromDate, toDate])
  const { pageItems, currentPage, totalPages } = paginateAdminItems(filtered, page, PAGE_SIZE)
  const counts = useMemo(
    () => countAdminStatuses(reservations, STATUSES, (reservation) => reservation.estado_reserva),
    [reservations],
  )

  function updateFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(1)
      setActionError(null)
    }
  }

  async function applyAction() {
    if (!pending) return
    setLoading(true)
    setActionError(null)
    try {
      if (pending.type === 'delete') {
        await onDelete(pending.reservation.id_reserva)
        setReservations((current) =>
          current.filter((reservation) => reservation.id_reserva !== pending.reservation.id_reserva),
        )
      } else {
        await onStatusChange(pending.reservation.id_reserva, pending.status)
        setReservations((current) =>
          current.map((reservation) =>
            reservation.id_reserva === pending.reservation.id_reserva
              ? { ...reservation, estado_reserva: pending.status }
              : reservation,
          ),
        )
      }
      setPending(null)
    } catch (error) {
      console.error('No se pudo actualizar la reserva desde el panel administrativo.', error)
      setActionError(error instanceof Error
        ? error.message
        : 'No se pudo completar la acción. Verifica tus permisos e inténtalo de nuevo.')
      setPending(null)
    } finally {
      setLoading(false)
    }
  }

  function requestStatus(reservation: ReservaDocument, status: EstadoReserva) {
    setPending({ reservation, type: 'status', status })
  }

  return (
    <div className="admin-panel-wrap">
      <div className="admin-stats">
        {STATUSES.map((status) => (
          <div className="stat-card" key={status}>
            <span className="stat-icon" aria-hidden="true">
              {status === 'pendiente' ? '🕓' : status === 'confirmada' ? '🟢' : '🔴'}
            </span>
            <div>
              <p className="stat-value">{counts.get(status)}</p>
              <p className="stat-label">{STATUS_LABELS[status]}s</p>
            </div>
          </div>
        ))}
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">📋</span>
          <div>
            <p className="stat-value">{reservations.length}</p>
            <p className="stat-label">Total de reservas</p>
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <div className="search-field">
            <span aria-hidden="true">🔍</span>
            <input
              aria-label="Buscar reservas"
              value={query}
              onChange={(event) => updateFilter(setQuery)(event.target.value)}
              placeholder="Buscar reserva, consumidor u oferta"
            />
          </div>
          <div className="toolbar-filters">
            <select
              aria-label="Filtrar reservas por estado"
              value={statusFilter}
              onChange={(event) =>
                updateFilter(setStatusFilter)(event.target.value as 'todos' | EstadoReserva)
              }
            >
              <option value="todos">Todos los estados</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>{STATUS_LABELS[status]}</option>
              ))}
            </select>
            <label>
              Desde
              <input
                aria-label="Desde la fecha de reserva"
                type="date"
                value={fromDate}
                onChange={(event) => updateFilter(setFromDate)(event.target.value)}
              />
            </label>
            <label>
              Hasta
              <input
                aria-label="Hasta la fecha de reserva"
                type="date"
                value={toDate}
                onChange={(event) => updateFilter(setToDate)(event.target.value)}
              />
            </label>
          </div>
        </div>

        {actionError && <div className="admin-error-banner" role="alert">{actionError}</div>}

        <div className="table-wrap">
          <table className="accounts-table">
            <thead>
              <tr>
                <th>Reserva</th>
                <th>Consumidor</th>
                <th>Oferta</th>
                <th>Fecha</th>
                <th>Cantidad</th>
                <th>Estado</th>
                <th className="col-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((reservation) => (
                <tr key={reservation.id_reserva}>
                  <td><span className="account-name">{reservation.id_reserva}</span></td>
                  <td>
                    <p className="account-name">{reservation.email_usuario}</p>
                    {reservation.email_usuario && (
                      <p className="account-email">{reservation.id_usuario}</p>
                    )}
                  </td>
                  <td>{reservation.id_producto}</td>
                  <td>{formatRelative(reservation.fecha_reserva)}</td>
                  <td>{reservation.cantidad}</td>
                  <td>
                    <span className={`status-badge ${STATUS_CLASSES[reservation.estado_reserva]}`}>
                      {STATUS_LABELS[reservation.estado_reserva]}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="row-actions">
                      {reservation.estado_reserva === 'pendiente' && (
                        <button
                          type="button"
                          className="icon-btn icon-btn-success"
                          title="Confirmar reserva"
                          aria-label={`Confirmar reserva ${reservation.id_reserva}`}
                          onClick={() => requestStatus(reservation, 'confirmada')}
                        >
                          ✓
                        </button>
                      )}
                      {reservation.estado_reserva !== 'cancelada' && (
                        <button
                          type="button"
                          className="icon-btn icon-btn-warning"
                          title="Cancelar reserva"
                          aria-label={`Cancelar reserva ${reservation.id_reserva}`}
                          onClick={() => requestStatus(reservation, 'cancelada')}
                        >
                          ↩
                        </button>
                      )}
                      <button
                        type="button"
                        className="icon-btn icon-btn-danger"
                        title="Eliminar reserva"
                        aria-label={`Eliminar reserva ${reservation.id_reserva}`}
                        onClick={() => setPending({ reservation, type: 'delete' })}
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td className="table-empty" colSpan={7}>No hay reservas que coincidan con los filtros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          <p>{filtered.length} reserva(s) · Página {currentPage} de {totalPages}</p>
          <div className="pagination-controls">
            <button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
              Anterior
            </button>
            <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {pending && (
        <ConfirmDialog
          title={pending.type === 'delete'
            ? 'Eliminar reserva'
            : pending.status === 'confirmada' ? 'Confirmar reserva' : 'Cancelar reserva'}
          message={pending.type === 'delete'
            ? 'La reserva se eliminará. Si aún retenía inventario, este se devolverá una sola vez.'
            : pending.status === 'cancelada'
              ? 'La reserva se cancelará y el inventario reservado se devolverá una sola vez.'
              : 'La reserva se confirmará. El inventario continuará reservado.'}
          confirmLabel={pending.type === 'delete' ? 'Eliminar' : STATUS_LABELS[pending.status]}
          variant={pending.type === 'delete' || pending.type === 'status' && pending.status === 'cancelada'
            ? 'danger'
            : 'primary'}
          loading={loading}
          onCancel={() => setPending(null)}
          onConfirm={() => void applyAction()}
        />
      )}
    </div>
  )
}
