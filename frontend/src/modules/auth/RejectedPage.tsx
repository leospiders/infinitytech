import { useAuthStore } from "../../stores/authStore";
import { MaterialIcon } from "../../components/ui/MaterialIcon";

export function RejectedPage() {
  const logout = useAuthStore((s) => s.logout);
  const rejectionReason = useAuthStore((s) => s.rejectionReason);

  return (
    <div className="flex h-screen items-center justify-center p-4 transition-colors">
      <div className="neo-card max-w-md w-full p-8 flex flex-col gap-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center mb-1">
            <MaterialIcon
              icon="cancel"
              fill
              wght={400}
              className="text-red-400"
              size={28}
            />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight font-display-md">
            SOLICITUD RECHAZADA
          </h1>
          <p className="text-xs text-on-surface-variant px-2">
            Tu solicitud de registro fue rechazada por un administrador.
          </p>
          {rejectionReason && (
            <div className="w-full rounded-xl p-4 bg-red-500/5 border border-red-500/20 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-red-400 mb-1">
                Motivo
              </p>
              <p className="text-xs text-on-surface-variant">
                {rejectionReason}
              </p>
            </div>
          )}
          <p className="text-xs text-on-surface-variant px-2">
            Si creés que esto es un error, contactate con el administrador del
            sistema.
          </p>
        </div>

        <button
          onClick={logout}
          className="neo-btn neo-btn-danger w-full py-3 text-sm font-bold"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
