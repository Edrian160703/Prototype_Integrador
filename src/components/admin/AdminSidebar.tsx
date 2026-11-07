import "./../../styles/admin/admin-sidebar.css"

export const SIDEBAR_ITEMS : AdminSidebarItem[] = [
  { key: "resumen", label: "Resumen", icon: "📊"},
  { key: "nuevos", label: "Nuevos", icon: "✨"},
  { key: "gestionar", label: "Gestionar", icon: "🛠️"},
  { key: "estadisticas", label: "Estadísticas", icon: "📈"},
];

type AdminSidebarItem = {
  key: string
  label: string
  icon: string
}

type AdminSidebarProps = {
  activeItem: string
  onSelect: (key: string) => void
}

export default function AdminSidebar({
  activeItem,
  onSelect,
}: AdminSidebarProps) {

  return (
    <>
      <nav className={`admin-sidebar`} aria-label="Navegación del panel administrativo">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = activeItem === item.key

          return (
            <button
              key={item.key}
              type="button"
              className={`admin-sidebar-item ${isActive ? "admin-sidebar-item-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onSelect(item.key)}
            >
              <span className="admin-sidebar-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
