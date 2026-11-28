import type { ManagedAccount } from "../../ports/accountRepository";
import type { OfertaConComercio } from "../../types/oferta";
import type { ReservaDocument } from "../../types/reserva";
import type { AdminTab } from "../../hooks/useAdminDashboard";

interface AdminOverviewProps {
  users: ManagedAccount[] | null;
  stores: ManagedAccount[] | null;
  reservations: ReservaDocument[] | null;
  offers: OfertaConComercio[] | null;
  onSelectAccount: (account: ManagedAccount) => void;
  onSelectTab: (tab: AdminTab) => void;
}

function AccountList({
  accounts,
  label,
  onSelect,
}: {
  accounts: ManagedAccount[] | null;
  label: string;
  onSelect: (account: ManagedAccount) => void;
}) {
  if (accounts === null) {
    return <p className="admin-overview-empty" role="status">Cargando {label}…</p>;
  }
  if (accounts.length === 0) {
    return <p className="admin-overview-empty">No hay {label} registrados.</p>;
  }

  return (
    <div className="admin-overview-list">
      {accounts.map((account) => (
        <button
          type="button"
          className="admin-overview-account"
          key={account.id}
          onClick={() => onSelect(account)}
          aria-label={`Ver información de ${account.displayName || account.email}`}
        >
          <span>
            <strong>{account.displayName || "Sin nombre"}</strong>
            <small>{account.email}</small>
          </span>
          <span className="admin-overview-arrow" aria-hidden="true">→</span>
        </button>
      ))}
    </div>
  );
}

export default function AdminOverview({
  users,
  stores,
  reservations,
  offers,
  onSelectAccount,
  onSelectTab,
}: AdminOverviewProps) {
  return (
    <div className="admin-overview">
      <section className="admin-overview-card">
        <header className="admin-overview-card-header">
          <h2>Ofertas publicadas</h2>
          <button type="button" onClick={() => onSelectTab("ofertas")}>
            Ver todas
          </button>
        </header>
        {offers === null ? (
          <p className="admin-overview-empty" role="status">Cargando ofertas…</p>
        ) : offers.length === 0 ? (
          <p className="admin-overview-empty">No hay ofertas registradas.</p>
        ) : (
          <div className="admin-overview-list">
            {offers.map((offer) => (
              <div className="admin-overview-offer" key={offer.id}>
                <span>
                  <strong>{offer.data.nombre_producto}</strong>
                  <small>{offer.comercio?.businessName || "Comercio FoodBack"}</small>
                </span>
                <span className={`status-badge status-${offer.data.estado}`}>
                  {offer.data.estado}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admin-overview-card">
        <header className="admin-overview-card-header">
          <h2>Consumidores</h2>
          <button type="button" onClick={() => onSelectTab("usuarios")}>
            Gestionar
          </button>
        </header>
        <AccountList
          accounts={users}
          label="consumidores"
          onSelect={onSelectAccount}
        />
        {reservations === null && (
          <p className="admin-overview-footnote" role="status">
            Cargando información de reservas…
          </p>
        )}
      </section>

      <section className="admin-overview-card">
        <header className="admin-overview-card-header">
          <h2>Comercios</h2>
          <button type="button" onClick={() => onSelectTab("comercios")}>
            Gestionar
          </button>
        </header>
        <AccountList
          accounts={stores}
          label="comercios"
          onSelect={onSelectAccount}
        />
      </section>
    </div>
  );
}
