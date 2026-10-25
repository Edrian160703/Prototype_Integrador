import type { OfertaConComercio } from '../../types/oferta'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function formatDate(value: Date): string {
  return value.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OffersPanel({ offers }: { offers: OfertaConComercio[] }) {
  return (
    <div className="admin-panel-wrap">
      <div className="admin-panel">
        <div className="admin-toolbar">
          <div>
            <strong>{offers.length}</strong> ofertas registradas
          </div>
        </div>

        <div className="table-wrap">
          <table className="accounts-table">
            <thead>
              <tr>
                <th>Oferta</th>
                <th>Comercio</th>
                <th>Precio</th>
                <th>Disponibles</th>
                <th>Vence</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {offers.map(({ id, data, comercio }) => (
                <tr key={id}>
                  <td>
                    <p className="account-name">{data.nombre_producto}</p>
                    <p className="account-email">{data.id_categoria}</p>
                  </td>
                  <td>{comercio?.businessName || 'Comercio FoodBack'}</td>
                  <td>
                    <p className="account-name">{formatCurrency(data.precio_oferta)}</p>
                    {data.precio_original !== data.precio_oferta && (
                      <p className="account-email">{formatCurrency(data.precio_original)}</p>
                    )}
                  </td>
                  <td>{data.cantidad_disponible}</td>
                  <td>{formatDate(data.fecha_limite)}</td>
                  <td>
                    <span className="status-badge">
                      {data.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {offers.length === 0 && (
                <tr>
                  <td colSpan={6}>No hay ofertas registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
