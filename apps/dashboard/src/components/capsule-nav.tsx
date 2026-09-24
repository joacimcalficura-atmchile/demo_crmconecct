'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Bell } from 'lucide-react';
import { useOwnerAlerts } from '@/hooks/useOwnerAlerts';
import { MobileAlertsSheet } from './layout/MobileAlertsSheet';
import { 
  LayoutDashboard, 
  MessageCircle, 
  FileText, 
  CalendarDays, 
  Users, 
  Settings,
  Activity,
  Bot,
  LogOut,
  Megaphone,
  ClipboardList,
  GitMerge,
  Store
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
}

const clientNav: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Conversaciones', href: '/dashboard/conversations', icon: MessageCircle },
  { name: 'Leads / CRM', href: '/dashboard/leads', icon: Users },
  { name: 'Cotizaciones', href: '/dashboard/quotes', icon: FileText },
  { name: 'Campañas', href: '/dashboard/campaigns', icon: Megaphone },
  { name: 'Proveedores', href: '/dashboard/suppliers', icon: Store },
  { name: 'Finanzas', href: '/dashboard/finance', icon: Activity },
  { name: 'Agenda', href: '/dashboard/calendar', icon: CalendarDays },
  { name: 'Agentes IA', href: '/dashboard/agents', icon: Bot },
  { name: 'Flujos', href: '/dashboard/flows', icon: GitMerge },
  { name: 'Encuesta', href: '/dashboard/feedback', icon: ClipboardList },
  { name: 'Config', href: '/dashboard/settings', icon: Settings },
];

function NavButton({
  item,
  isActive,
  isDanger = false,
  onClick,
  badge = 0
}: {
  item: { name: string, icon: any, href?: string },
  isActive: boolean,
  isDanger?: boolean,
  onClick?: () => void,
  /** Contador rojo sobre el ícono. En 0 no se dibuja nada. */
  badge?: number
}) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon;
  
  const content = (
    <div
      className={`relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl transition-colors duration-200 group flex-shrink-0 cursor-pointer overflow-hidden ${
        isActive 
          ? 'text-white shadow-lg' 
          : isDanger
            ? 'text-rose-400 hover:bg-rose-500/10'
            : 'text-slate-400 hover:text-white hover:bg-white/10'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {isActive && (
        <motion.div
          layoutId="active-dock-item"
          className="absolute inset-0 rounded-xl"
          style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.5), rgba(56,189,248,0.2))', border: '1px solid rgba(14,165,233,0.4)' }}
          initial={false}
          transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.8 }}
        />
      )}
      
      <div className="flex items-center justify-center w-5 h-5 shrink-0 relative z-10" title={item.name}>
        <Icon className={`w-5 h-5 transition-transform duration-200 ${isHovered && !isActive ? 'scale-110 text-white' : ''} ${isActive ? 'text-sky-300' : ''}`} />
      </div>

      {/* El contenedor tiene overflow-hidden, así que el contador va DENTRO
          del borde (top-1/right-1) en vez de asomado con offsets negativos. */}
      {badge > 0 && (
        <span className="absolute top-1 right-1 z-20 min-w-[15px] h-[15px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-bold leading-none">
          {badge > 9 ? '9+' : badge}
        </span>
      )}

    </div>
  );

  return item.href ? (
    <Link
      href={item.href}
      aria-label={item.name}
      prefetch
      className="flex-shrink-0 block"
    >
      {content}
    </Link>
  ) : (
    <div aria-label={item.name} className="flex-shrink-0 block" onClick={(e) => {
      e.preventDefault();
      onClick?.();
    }}>
      {content}
    </div>
  );
}

export function CapsuleNav() {
  const pathname = usePathname();
  const navItems = clientNav;
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  // El dock es la única barra que se ve en celular (TopNav es `hidden md:flex`),
  // así que sin esto el dueño solo se enteraba de un pendiente por WhatsApp.
  // La demo concentra las alertas ficticias en el menú móvil.
  const [alertsOpen, setAlertsOpen] = useState(false);
  const { alerts, unread, loading, failed, seen, markAllSeen, markSeen } = useOwnerAlerts(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <div data-capsule-nav className="fixed bottom-6 left-0 right-0 z-50 px-4 pointer-events-none flex justify-center">
      <nav 
        className="pointer-events-auto bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl p-2 flex items-center justify-start sm:justify-center gap-1 shadow-2xl shadow-black/50 overflow-x-auto scrollbar-none max-w-[95vw] lg:max-w-[1400px]"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }} 
      >
        
        {navItems.map((item) => (
          <NavButton 
            key={item.name}
            item={item}
            isActive={pathname === item.href}
          />
        ))}

        {/* Separator */}
        <div className="w-px h-8 bg-white/10 mx-1 sm:mx-2 flex-shrink-0"></div>

        {/* Alertas — única vía de aviso en celular (TopNav es solo escritorio) */}
        {(
          <NavButton
            item={{ name: unread.length ? `Alertas (${unread.length} sin ver)` : 'Alertas', icon: Bell }}
            isActive={alertsOpen}
            badge={unread.length}
            onClick={() => setAlertsOpen(v => !v)}
          />
        )}

        {/* Theme Toggle */}
        <NavButton
          item={{ name: isDark ? 'Modo Claro' : 'Modo Oscuro', icon: isDark ? Sun : Moon }}
          isActive={false}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        />

        {/* Logout Button */}
        <NavButton
          item={{ name: 'Cerrar Sesión', icon: LogOut }}
          isActive={false}
          isDanger={true}
          onClick={() => signOut({ callbackUrl: '/login' })}
        />

      </nav>

      {/* Va fuera del <nav>: el dock tiene overflow-x-auto y recortaría la hoja.
          El componente además la manda a un portal en document.body. */}
      {(
        <MobileAlertsSheet
          open={alertsOpen}
          onClose={() => setAlertsOpen(false)}
          alerts={alerts}
          seen={seen}
          loading={loading}
          failed={failed}
          unreadCount={unread.length}
          onMarkAllSeen={markAllSeen}
          onMarkSeen={markSeen}
        />
      )}
    </div>
  );
}
