import { MaterialIcon } from '../../components/ui/MaterialIcon';

interface Props {
  onRequestLogin: () => void;
}

export function LandingFooter({ onRequestLogin }: Props) {
  return (
    <footer className="bg-[#080616] border-t border-white/5 py-24 px-6 md:px-12 text-[#A5A5A5] font-light">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

        {/* Logo & Slogan (Col 1-4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-[#00C8F8] border border-[#00C8F8]/30">
              <span className="font-light text-base">∞</span>
            </div>
            <span className="font-bold tracking-[0.15em] text-xs text-white uppercase font-display">
              INFINITY <span className="font-light text-white/50">TECH</span>
            </span>
          </div>
          <p className="text-xs leading-relaxed max-w-sm">
            Laboratorio especializado en microsoldadura, reemplazo de componentes de grado quirúrgico y venta de repuestos premium certificados para smartphones y computadoras.
          </p>
          <div className="flex items-center gap-4 text-white/60">
            <a href="#" className="hover:text-[#00C8F8] transition-colors duration-300">
              <span className="text-xs font-bold tracking-widest uppercase">FB</span>
            </a>
            <span className="text-white/10">•</span>
            <a href="#" className="hover:text-[#00C8F8] transition-colors duration-300">
              <span className="text-xs font-bold tracking-widest uppercase">IG</span>
            </a>
            <span className="text-white/10">•</span>
            <a href="#" className="hover:text-[#00C8F8] transition-colors duration-300">
              <span className="text-xs font-bold tracking-widest uppercase">LN</span>
            </a>
          </div>
        </div>

        {/* Informacion & Horario (Col 5-8) */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact Info */}
          <div className="flex flex-col gap-6">
            <h4 className="text-xs font-bold tracking-[0.2em] text-white uppercase font-display">CONTACTO</h4>
            <ul className="flex flex-col gap-3 text-xs">
              <li className="flex items-start gap-2">
                <MaterialIcon icon="pin_drop" size={16} className="text-[#00C8F8] shrink-0" />
                <span>Calle Comercio Gal. Elegans #850, Of. 2 y 3</span>
              </li>
              <li className="flex items-center gap-2">
                <MaterialIcon icon="call" size={16} className="text-[#00C8F8]" />
                <span>+591 60574727</span>
              </li>
              <li className="flex items-center gap-2">
                <MaterialIcon icon="mail" size={16} className="text-[#00C8F8]" />
                <span>info@infinitytech.com</span>
              </li>
            </ul>
          </div>

          {/* Horario */}
          <div className="flex flex-col gap-6">
            <h4 className="text-xs font-bold tracking-[0.2em] text-white uppercase font-display">HORARIO</h4>
            <ul className="flex flex-col gap-3 text-xs">
              <li className="flex flex-col">
                <span className="text-white font-medium">Lunes a Viernes</span>
                <span className="text-white/60 font-light mt-0.5">09:00 - 19:30</span>
              </li>
              <li className="flex flex-col">
                <span className="text-white font-medium">Sábados</span>
                <span className="text-white/60 font-light mt-0.5">09:00 - 13:00</span>
              </li>
              <li className="flex flex-col">
                <span className="text-rose-500 font-bold uppercase tracking-wider text-[10px]">Domingos Cerrado</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Small Map (Col 9-12) */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          <h4 className="text-xs font-bold tracking-[0.2em] text-white uppercase font-display">UBICACIÓN</h4>
          {/* Dark map mockup */}
          <div className="w-full h-40 rounded-xl overflow-hidden bg-[#131320] border border-white/5 relative group flex items-center justify-center">
            <div className="absolute inset-0 z-0 opacity-40 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] flex items-center justify-center">
              <div className="absolute w-[2px] h-full bg-white/10 left-1/3" />
              <div className="absolute h-[2px] w-full bg-white/10 top-1/2" />
              <div className="absolute w-[2px] h-full bg-[#2F2FE4]/30 left-1/2 rotate-45" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#00C8F8]/10 border border-[#00C8F8] flex items-center justify-center animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00C8F8]" />
              </div>
              <span className="text-[10px] font-bold tracking-widest text-white uppercase font-display">Infinity Tech Lab</span>
            </div>

            <a
              href="https://maps.google.com/?q=Calle+Comercio+Gal.+Elegans+850,+Santa+Cruz"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 px-3 py-1.5 bg-[#080616] hover:bg-[#00C8F8] hover:text-[#080616] text-[10px] font-bold tracking-widest text-white uppercase border border-white/10 rounded-sm transition-all duration-300 cursor-pointer"
            >
              Ver mapa
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto h-px bg-white/5 my-12" />

      <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-[10px] tracking-widest font-mono">
        <p className="uppercase text-[#A5A5A5]/60">
          © {new Date().getFullYear()} Infinity Technology. Todos los derechos reservados.
        </p>
        <button
          onClick={onRequestLogin}
          className="flex items-center gap-1.5 hover:text-white uppercase transition-colors duration-300 cursor-pointer"
        >
          <MaterialIcon icon="lock" size={12} wght={300} />
          Acceso Personal Autorizado
        </button>
      </div>
    </footer>
  );
}
