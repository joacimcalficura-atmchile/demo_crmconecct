'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  MessageCircle,
  Users,
  FileText,
  Megaphone,
  Store,
  Activity,
  CalendarDays,
  Bot,
  GitMerge,
  ClipboardList,
  Settings,
  LogOut,
  Monitor
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
}

const mainNav: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Conversaciones', href: '/dashboard/conversations', icon: MessageCircle },
  { name: 'Leads / CRM', href: '/dashboard/leads', icon: Users },
  { name: 'Cotizaciones', href: '/dashboard/quotes', icon: FileText },
  { name: 'Caja en Vivo', href: '/dashboard/caja', icon: Monitor },
  { name: 'Campañas', href: '/dashboard/campaigns', icon: Megaphone },
  { name: 'Proveedores', href: '/dashboard/suppliers', icon: Store },
  { name: 'Finanzas', href: '/dashboard/finance', icon: Activity },
  { name: 'Agenda', href: '/dashboard/calendar', icon: CalendarDays },
  { name: 'Agentes IA', href: '/dashboard/agents', icon: Bot },
  { name: 'Flujos', href: '/dashboard/flows', icon: GitMerge },
  { name: 'Encuesta', href: '/dashboard/feedback', icon: ClipboardList },
];

const systemNav: NavItem[] = [
  { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  // Resaltado ACTIVO OPTIMISTA: al hacer clic, marcamos el ítem al instante sin
  // esperar a que termine el fetch de la sección (usePathname solo cambia cuando
  // la navegación ya se confirmó). Sin esto, el sidebar no reaccionaba al clic y
  // el usuario clickeaba varias veces creyendo que no registró. Se limpia cuando
  // pathname ya refleja la nueva ruta.
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  useEffect(() => { setPendingHref(null); }, [pathname]);
  const activeHref = pendingHref ?? pathname;
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('ATM CHILE');

  useEffect(() => {
    fetch('/api/proxy/config')
      .then(r => r.json())
      .then(d => {
        if (d && d.logo_url) {
          setLogoUrl(d.logo_url);
          // Forzar la actualización del Favicon en el navegador eliminando favicons antiguos
          document.querySelectorAll("link[rel*='icon']").forEach((el) => el.remove());
          ['icon', 'shortcut icon', 'apple-touch-icon'].forEach((rel) => {
            const link = document.createElement('link');
            link.rel = rel;
            link.href = d.logo_url;
            document.head.appendChild(link);
          });
        }
        if (d && d.name) {
          setCompanyName(d.name);
          document.title = `${d.name} — Dashboard`;
        }
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 z-40 bg-slate-50/80 backdrop-blur-xl dark:bg-gradient-to-b dark:from-slate-900 dark:via-[#131b26] dark:to-slate-950 border-r border-slate-200/80 dark:border-slate-800/80 shadow-lg dark:shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
      <div className="p-8 flex flex-col items-center justify-center gap-4 border-b border-slate-200/80 dark:border-slate-800/80 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-200/50 dark:to-slate-900/50 pointer-events-none" />
        <div className="w-36 h-36 rounded-xl bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shadow-lg dark:shadow-xl border border-slate-200 dark:border-slate-700/60 dark:shadow-inner overflow-hidden shrink-0 relative group z-10">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo Institucional" className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
              <Bot className="w-16 h-16 text-white drop-shadow-md" />
            </div>
          )}
        </div>
        <div className="text-center z-10">
          <h1 className="text-lg font-black text-slate-800 dark:text-slate-200 tracking-widest uppercase drop-shadow-sm dark:drop-shadow-md">{companyName}</h1>
          <div className="mt-2 flex flex-col items-center justify-center space-y-0.5">
            <span className="text-[9px] text-slate-500 dark:text-slate-400 tracking-[0.2em] font-medium lowercase">
              from
            </span>
            <span className="text-[10px] text-sky-700 dark:text-cyan-600/80 tracking-[0.1em] font-bold uppercase">
              ATM FUTURE SOLUTIONS
            </span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-black tracking-widest lowercase drop-shadow-[0_0_6px_rgba(37,99,235,0.8)]">
              a tu medida
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-6 px-4 space-y-8">
        <div>
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">Gestión Principal</h2>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const isActive = activeHref === item.href;
              return (
                <Link key={item.name} href={item.href} prefetch onClick={() => setPendingHref(item.href)} className="block relative group">
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                    isActive ? 'text-sky-800 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/30'
                  }`}>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl bg-white dark:bg-gradient-to-r dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 shadow-sm dark:shadow-[inset_1px_1px_2px_rgba(255,255,255,0.05)]"
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      >
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-sky-500 dark:bg-cyan-500/80 rounded-r-full shadow-[0_0_10px_rgba(14,165,233,0.3)] dark:shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                      </motion.div>
                    )}
                    <item.icon className={`w-5 h-5 relative z-10 transition-transform duration-300 ${isActive ? 'text-sky-600 dark:text-cyan-400 scale-110 drop-shadow-sm dark:drop-shadow-md' : 'group-hover:scale-110 text-slate-400 dark:text-slate-500 group-hover:text-sky-600 dark:group-hover:text-slate-300'}`} />
                    <span className="text-sm font-semibold relative z-10 tracking-wide">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">Sistema</h2>
          <nav className="space-y-1">
            {systemNav.map((item) => {
              const isActive = activeHref === item.href;
              return (
                <Link key={item.name} href={item.href} prefetch onClick={() => setPendingHref(item.href)} className="block relative group">
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                    isActive ? 'text-sky-800 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/30'
                  }`}>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl bg-white dark:bg-gradient-to-r dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 shadow-sm dark:shadow-[inset_1px_1px_2px_rgba(255,255,255,0.05)]"
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      >
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-sky-500 dark:bg-cyan-500/80 rounded-r-full shadow-[0_0_10px_rgba(14,165,233,0.3)] dark:shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                      </motion.div>
                    )}
                    <item.icon className={`w-5 h-5 relative z-10 transition-transform duration-300 ${isActive ? 'text-sky-600 dark:text-cyan-400 scale-110 drop-shadow-sm dark:drop-shadow-md' : 'group-hover:scale-110 text-slate-400 dark:text-slate-500 group-hover:text-sky-600 dark:group-hover:text-slate-300'}`} />
                    <span className="text-sm font-semibold relative z-10 tracking-wide">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
