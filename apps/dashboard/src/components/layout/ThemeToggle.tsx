'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

/**
 * ThemeToggle — Conmutador claro/oscuro con animación fluida.
 * Usa next-themes (attribute="class"). Evita el hydration mismatch
 * renderizando un placeholder hasta que el componente monta en cliente.
 */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  // Placeholder del mismo tamaño para no romper el layout antes de montar
  if (!mounted) {
    return (
      <div
        aria-hidden
        className={compact ? 'w-9 h-9' : 'w-9 h-9 rounded-lg'}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className="relative flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ y: 12, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -12, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
            className="absolute"
          >
            <Moon className="w-[18px] h-[18px]" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ y: 12, opacity: 0, rotate: 90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -12, opacity: 0, rotate: -90 }}
            transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
            className="absolute"
          >
            <Sun className="w-[18px] h-[18px]" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
