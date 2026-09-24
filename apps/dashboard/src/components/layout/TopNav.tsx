'use client';

import { useSession } from 'next-auth/react';
import { Search, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { NotificationsBell } from './NotificationsBell';

export function TopNav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Simple formatter to get a readable title from pathname
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Inicio';
    const path = pathname.split('/').pop();
    if (!path) return 'Inicio';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <header className="hidden md:flex h-20 w-full items-center justify-between px-8 z-30 relative mb-4">
      <div className="flex items-center gap-6">
        {/* Breadcrumb / Title area */}
        <div className="glass-panel px-6 py-2.5 flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-300 capitalize">{getPageTitle()}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Actions */}
        <div className="glass-panel flex items-center p-1.5 gap-1">
          <ThemeToggle />
          <div className="w-px h-5 bg-slate-300/50 dark:bg-white/10 mx-0.5" />
          <button className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <NotificationsBell />
          <Link href="/dashboard/settings" className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
          </Link>
        </div>

        {/* User Profile */}
        <div className="glass-panel flex items-center gap-3 pl-3 pr-4 py-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-inner">
            {session?.user?.name ? session.user.name.substring(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 dark:text-white leading-none mb-1">
              {session?.user?.name || 'Administrador'}
            </span>
            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold leading-none uppercase tracking-wider">
              System Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
