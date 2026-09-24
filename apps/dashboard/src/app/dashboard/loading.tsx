// Skeleton de carga a nivel del segmento /dashboard.
//
// Antes NO existía ningún loading.tsx: cada sección es un server component que
// hace `await api.getX()` (fetch al bot, sin caché) ANTES de renderizar, así que
// al cambiar de sección la UI quedaba congelada mostrando la sección anterior
// hasta que respondía el bot (hasta 25s). Con este archivo, Next muestra este
// skeleton al INSTANTE al navegar (el sidebar del layout se mantiene) y el
// contenido real entra por streaming cuando llega la data. Navegación fluida en
// PC y móvil, y el prefetch de los <Link> precarga este estado.
export default function DashboardLoading() {
  return (
    <div className="w-full animate-in fade-in duration-200" aria-busy="true" aria-label="Cargando sección">
      {/* Título */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-52 rounded-lg bg-slate-200/70 dark:bg-white/10 animate-pulse" />
        <div className="h-8 w-8 rounded-full border-2 border-[#10b981]/30 border-t-[#10b981] animate-spin" />
      </div>

      {/* Fila de tarjetas de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>

      {/* Bloque de contenido principal */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-100/70 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
    </div>
  );
}
