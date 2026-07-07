import { useAuthStore } from '../../stores/authStore';
import { MaterialIcon } from '../../components/ui/MaterialIcon';

export function SuspendedPage() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex h-screen items-center justify-center p-4 transition-colors">
      <div className="neo-card max-w-md w-full p-8 flex flex-col gap-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-500 to-orange-500" />

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-14 w-14 rounded-full bg-yellow-500/10 flex items-center justify-center mb-1">
            <MaterialIcon icon="block" fill wght={400} className="text-yellow-400" size={28} />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight font-display-md">
            CUENTA SUSPENDIDA
          </h1>
          <p className="text-xs text-on-surface-variant px-2">
            Tu cuenta ha sido suspendida. No podés acceder al sistema hasta nuevo aviso.
          </p>
          <p className="text-xs text-on-surface-variant px-2">
            Contactate con el administrador para más información.
          </p>
        </div>

        <button onClick={logout} className="neo-btn neo-btn-danger w-full py-3 text-sm font-bold">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
