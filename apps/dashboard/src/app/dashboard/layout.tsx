import { CapsuleNav } from '@/components/capsule-nav';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-app-shell className="relative h-[100dvh] pb-20 md:pb-0 flex overflow-hidden">
      {/* ── Fondo imagen ATM ────────────────────────────────── */}
      {/* Fondo de Plataforma */}
      <div
        className="fixed inset-0 z-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url(/premium_bg.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Overlay responsive para legibilidad del contenido */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-slate-50/90 dark:bg-black/60 transition-colors duration-300" />
      
      {/* Tipografía HTML Ultra-Nítida (Marca de Agua) */}
      <div className="fixed inset-0 z-0 pointer-events-none flex flex-col items-center justify-center overflow-hidden opacity-[0.03] dark:opacity-[0.02]">
        <h1 className="text-[250px] font-black text-slate-900 dark:text-white leading-[0.8] tracking-tighter select-none">
          ATM
        </h1>
        <h2 className="text-[60px] font-extrabold text-slate-900 dark:text-white tracking-[0.5em] select-none ml-4 mt-2">
          A TU MEDIDA
        </h2>
      </div>


      {/* Destellos decorativos sutiles sobre el fondo */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-violet-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-amber-400/5 rounded-full blur-3xl" />
      </div>

      <div className="main-content-wrapper relative z-10 flex w-full h-full transition-all duration-300">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden md:pl-64">
          <div className="w-full pt-2 md:pt-4 px-4 hidden md:block shrink-0">
            <TopNav />
          </div>
          <main data-app-main className="flex-1 min-h-0 flex flex-col max-w-[1600px] mx-auto w-full px-2 sm:px-4 lg:px-6 py-2 overflow-y-auto">
            <div role="status" className="mb-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
              DEMO ACEROS TEMUCO · Datos ficticios. WhatsApp, campañas y cambios están simulados.
            </div>
            {children}
          </main>
        </div>
      </div>
      
      <div className="relative z-50 md:hidden block">
        <CapsuleNav />
      </div>

    </div>
  );
}
