import { useEffect, useState } from "react";
import AdminSidebar, {
  SIDEBAR_ITEMS,
} from "../../components/admin/AdminSidebar";
import "./../../styles/admin-global.css"
import AdminGestion from "../../components/admin/AdminGestion";
import AdminResumen from "../../components/admin/AdminResumen";

export default function AdminHome() {

  const [sidebarActive, setSidebarActive] = useState("resumen")

  function handleSidebarSelect(selectedKey: string){
    const selectedItem = SIDEBAR_ITEMS.find((item) => item.key === selectedKey);

    if (!selectedItem) return(console.log(`tried selecting ${selectedItem}`))

    setSidebarActive(selectedKey)  
    const nextHash = `#${selectedItem.key}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
  }

  useEffect(() => {
    const syncTabFromHash = () => {
      const hashKey = window.location.hash.replace("#", "");
      const selectedItem = SIDEBAR_ITEMS.find((item) => item.key === hashKey);

      if (!selectedItem) {
        if (window.location.hash === "") {
          const fallback = SIDEBAR_ITEMS[0];
          if (fallback) {
            setSidebarActive(fallback.key);
          }
        }
        return;
      }

      setSidebarActive(selectedItem.key);
    };

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);

    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, [sidebarActive]);

  return (
    <>
      <AdminSidebar
        activeItem={sidebarActive}
        onSelect={handleSidebarSelect}
      ></AdminSidebar>

      <div className="admin-content">
        <AdminResumen></AdminResumen>
        <AdminGestion></AdminGestion>
      </div>
    </>
  );
}
