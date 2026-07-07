import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MaterialIcon } from "../components/ui/MaterialIcon";
import { useAuthStore } from "../stores/authStore";

export type TabKey =
  | "dashboard"
  | "pos"
  | "repairs"
  | "inventory"
  | "history"
  | "users"
  | "profile"
  | "stock"
  | "my-orders";

const iconMap: Record<string, string> = {
  dashboard: "dashboard",
  pos: "shopping_cart",
  repairs: "build",
  inventory: "inventory_2",
  history: "history",
  users: "group",
  stock: "assignment",
  "my-orders": "description",
  profile: "person",
};

/* ─── Nav item component ─────────────────────────────────── */

function NavItem({
  tabKey,
  label,
  active,
  rightIcon,
  onSelect,
  onRightClick,
}: {
  tabKey: TabKey;
  label: string;
  active: boolean;
  rightIcon?: string;
  onSelect: () => void;
  onRightClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`group flex items-center justify-between w-full pl-4 pr-3 py-2.5 text-sm
        transition-all duration-150 border-l-2 cursor-pointer select-none
        ${
          active
            ? "border-l-cyan-accent text-cyan-accent"
            : "border-l-transparent text-on-surface-variant hover:text-on-surface"
        }`}
      style={{
        backgroundColor: active
          ? "var(--c-primary-soft)"
          : hovered
            ? "var(--c-hover)"
            : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3 min-w-0">
        <MaterialIcon
          icon={iconMap[tabKey]}
          wght={active ? 400 : 300}
          size={17}
          className="shrink-0 transition-all duration-150"
        />
        <span className="truncate">{label}</span>
      </div>

      {rightIcon && (
        <span
          className="flex items-center justify-center w-5 h-5 rounded text-xs cursor-pointer shrink-0
            text-on-surface-variant/30 group-hover:text-on-surface-variant/60
            transition-colors duration-150"
          onClick={(e) => {
            e.stopPropagation();
            onRightClick?.();
          }}
        >
          <MaterialIcon icon={rightIcon} size={14} wght={400} />
        </span>
      )}
    </div>
  );
}

/* ─── Constants for sections ─────────────────────────────── */

const SECTION_HEADER =
  "pl-4 pr-3 pb-1 text-[10px] font-semibold text-on-surface-variant/40 uppercase tracking-[0.12em] select-none";

/* ─── Sidebar component ──────────────────────────────────── */

export function Sidebar({
  activeTab,
  onTabChange,
  darkMode,
  onToggleTheme,
  onNewRepairOrder,
}: {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  onNewRepairOrder?: () => void;
}) {
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  const role = user?.role || "";

  // Spare Parts (stock) removed — no longer in the nav
  const allTabs: {
    key: TabKey;
    label: string;
    section: "operations" | "admin";
  }[] = [
    { key: "dashboard", label: t("sidebar.dashboard"), section: "operations" },
    { key: "pos", label: t("sidebar.pos"), section: "operations" },
    { key: "repairs", label: t("sidebar.repairs"), section: "operations" },
    { key: "inventory", label: t("sidebar.inventory"), section: "admin" },
    { key: "history", label: t("sidebar.history"), section: "admin" },
    { key: "users", label: t("sidebar.users"), section: "admin" },
  ];

  const tabs = allTabs.filter(({ key }) => {
    if (role === "ADMIN") return true;
    if (role === "TECH_IT" || role === "TECH_COM") return key !== "users";
    return false;
  });

  /* ─── Shared helpers ──────────────────────────────────── */

  const onSelect = (key: TabKey) => {
    onTabChange(key);
    setMobileOpen(false);
  };

  const renderGroup = (section: "operations" | "admin") => {
    const items = tabs.filter((t) => t.section === section);
    if (!items.length) return null;

    return (
      <div className="flex flex-col gap-0.5">
        <span className={SECTION_HEADER}>
          {t(
            section === "operations"
              ? "sidebar.sectionOperations"
              : "sidebar.sectionAdmin",
            section === "operations" ? "Operaciones" : "Administración",
          )}
        </span>
        {items.map(({ key, label }) =>
          key === "repairs" ? (
            <NavItem
              key={key}
              tabKey={key}
              label={label}
              active={activeTab === key}
              rightIcon="add"
              onSelect={() => onSelect(key)}
              onRightClick={() => { onNewRepairOrder?.(); setMobileOpen(false); }}
            />
          ) : (
            <NavItem
              key={key}
              tabKey={key}
              label={label}
              active={activeTab === key}
              onSelect={() => onSelect(key)}
            />
          ),
        )}
      </div>
    );
  };

  /* ─── Nav (shared between desktop & mobile) ────────────── */

  const nav = (
    <div className="flex flex-col h-full">
      {/* ── Logo + Theme toggle ── */}
      <div className="flex items-center justify-between mb-8 pl-4 pr-2">
        <div className="flex items-center gap-2.5 min-w-0 font-display-md">
          <div className="h-8 w-8 rounded-lg bg-cyan-accent flex items-center justify-center text-[#0A0A0A] font-bold text-lg shrink-0">
            ∞
          </div>
          <div className="min-w-0 tracking-tight text-xs uppercase flex gap-1 items-baseline">
            <span className="font-bold text-on-surface">INFINITY</span>
            <span className="font-normal text-on-surface-variant">
              TECHNOLOGY
            </span>
          </div>
        </div>
        <button
          onClick={onToggleTheme}
          className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors duration-150"
          style={{ color: "var(--c-text-sec)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--c-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          <MaterialIcon
            icon={darkMode ? "light_mode" : "dark_mode"}
            wght={300}
            size={18}
          />
        </button>
      </div>

      {/* ── User info ── */}
      <div className="flex items-center gap-2 mb-6 pl-4 pr-3">
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className="text-sm font-semibold truncate text-on-surface">
            {user?.name}
          </span>
          <span className="text-[10px] text-on-surface-variant/60 tracking-widest uppercase font-medium">
            {user?.role}
          </span>
        </div>
        <button
          onClick={() => onSelect("profile")}
          className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors duration-150 shrink-0"
          style={{ color: "var(--c-text-sec)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--c-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
          title={t("sidebar.profile")}
        >
          <MaterialIcon
            icon="person"
            wght={300}
            className="text-on-surface-variant"
            size={18}
          />
        </button>
      </div>

      {/* ── Navigation groups ── */}
      <nav className="flex flex-col gap-4 flex-1">
        {renderGroup("operations")}
        {renderGroup("admin")}
      </nav>

      {/* ── Logout ── */}
      <div className="pl-4 pr-3 mt-3 pt-3 border-t border-outline-variant/30">
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full py-2.5 text-sm
            text-on-surface-variant hover:text-error hover:bg-error/[0.06]
            rounded-lg transition-all duration-150"
        >
          <MaterialIcon icon="logout" wght={300} size={17} />
          {t("sidebar.logOut")}
        </button>
      </div>
    </div>
  );

  /* ─── Desktop sidebar ──────────────────────────────────── */

  return (
    <>
      <aside
        className="hidden lg:flex w-64 py-5 pr-3 flex-col border-r"
        style={{
          backgroundColor: "var(--c-sidebar)",
          borderColor: "var(--c-sidebar-border)",
        }}
      >
        {nav}
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass-panel px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          className="neo-btn p-2 rounded-lg"
        >
          <MaterialIcon
            icon="menu"
            wght={300}
            className="text-on-surface-variant"
            size={20}
          />
        </button>
        <div className="flex items-center gap-2 font-display-md">
          <div className="h-8 w-8 rounded-lg bg-cyan-accent flex items-center justify-center text-[#0A0A0A] font-bold text-xs">
            ∞
          </div>
          <span className="font-bold text-xs uppercase text-on-surface">
            INFINITY TECHNOLOGY
          </span>
        </div>
        <button
          onClick={onToggleTheme}
          className="neo-btn h-8 w-8 rounded-lg flex items-center justify-center"
        >
          <MaterialIcon
            icon={darkMode ? "light_mode" : "dark_mode"}
            wght={300}
            className="text-cyan-accent"
            size={18}
          />
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="absolute left-0 top-0 bottom-0 w-72 py-5 pr-3 border-r border-outline-variant overflow-y-auto"
            style={{ backgroundColor: "var(--c-sidebar)" }}
          >
            <div className="flex justify-end px-4 mb-2">
              <button
                onClick={() => setMobileOpen(false)}
                className="neo-btn p-2 rounded-lg"
              >
                <MaterialIcon
                  icon="close"
                  wght={300}
                  className="text-on-surface-variant"
                  size={20}
                />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}
    </>
  );
}
