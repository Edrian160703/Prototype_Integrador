import useMisReservas from '../hooks/useMisReservas'
import type { ReservaConOferta } from '../types/reserva'

interface MisReservasProps {
  idUsuario: string
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente de recojo',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
}

function formatearFecha(reserva: ReservaConOferta): string {
  const fecha = reserva.fecha_reserva
  return fecha.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MisReservas({ idUsuario }: MisReservasProps) {
  const {
    reservas,
    loading,
    error,
    cancelandoId,
    errorCancelId,
    errorCancelMessage,
    reservaAEliminar,
    selectReservaToDelete,
    closeDeleteConfirmation,
    confirmDelete,
  } = useMisReservas(idUsuario)

  return (
    <section id="reservas" className="profile-section" aria-labelledby="consumer-reservas-title">
      <header className="profile-section-head">
        <span className="profile-section-icon" aria-hidden="true">🧾</span>
        <div>
          <h2 id="consumer-reservas-title">Mis reservas</h2>
          <p>El historial de todo lo que reservaste en FoodBack.</p>
        </div>
      </header>

      {loading && <p className="profile-empty-note">Cargando tus reservas...</p>}
      {!loading && error && <p className="field-error">{error}</p>}
      {!loading && !error && reservas.length === 0 && (
        <p className="profile-empty-note">Todavía no hiciste ninguna reserva.</p>
      )}

      {!loading && !error && reservas.length > 0 && (
        <div className="reservas-list">
          {reservas.map((reserva) => (
            <div className="reserva-item" key={reserva.id_reserva}>
              <div className="reserva-item-img">
                {reserva.imagen_url ? (
                  <img src={reserva.imagen_url} alt={reserva.nombre_producto} />
                ) : (
                  <div className="reserva-item-img-placeholder" />
                )}
              </div>

              <div className="reserva-item-info">
                <span className="reserva-item-title">{reserva.nombre_producto}</span>
                <span className="reserva-item-meta">
                  Cantidad: {reserva.cantidad} · S/ {(reserva.precio_oferta * reserva.cantidad).toFixed(2)}
                </span>
                {reserva.horario_recojo && (
                  <span className="reserva-item-meta">🕒 Recojo: {reserva.horario_recojo}</span>
                )}
                <span className="reserva-item-meta">{formatearFecha(reserva)}</span>
              </div>

              <div className="reserva-item-actions">
                <span className={`reserva-item-estado reserva-item-estado-${reserva.estado_reserva}`}>
                  {ESTADO_LABEL[reserva.estado_reserva] ?? reserva.estado_reserva}
                </span>
                <button
                  type="button"
                  className="reserva-item-delete"
                  aria-label="Eliminar reserva"
                  onClick={() => selectReservaToDelete(reserva)}
                  disabled={cancelandoId === reserva.id_reserva}
                >
                  {cancelandoId === reserva.id_reserva ? '...' : '🗑'}
                </button>
                {errorCancelId === reserva.id_reserva && (
                  <span className="field-error">{errorCancelMessage ?? 'No se pudo cancelar la reserva.'}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {reservaAEliminar && (
        <div className="reserva-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="reserva-confirm-title">
          <div className="reserva-confirm-modal">
            <h3 id="reserva-confirm-title" className="reserva-confirm-title">¿Eliminar reserva?</h3>
            <p className="reserva-confirm-body">
              ¿Estás seguro de que deseas quitar "{reservaAEliminar.nombre_producto}" de tu lista?
            </p>
            <div className="reserva-confirm-actions">
              <button
                type="button"
                className="reserva-confirm-btn reserva-confirm-btn-secondary"
                onClick={closeDeleteConfirmation}
                disabled={cancelandoId === reservaAEliminar.id_reserva}
              >
                Mantener reserva
              </button>
              <button
                type="button"
                className="reserva-confirm-btn reserva-confirm-btn-danger"
                onClick={() => void confirmDelete()}
                disabled={cancelandoId === reservaAEliminar.id_reserva}
              >
                {cancelandoId === reservaAEliminar.id_reserva ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
