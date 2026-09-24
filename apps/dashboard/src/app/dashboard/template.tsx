'use client';

import { motion } from 'framer-motion';

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: 'blur(8px)', scale: 0.99 }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
      exit={{ opacity: 0, y: -15, filter: 'blur(8px)', scale: 0.99 }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 30, 
        mass: 0.8,
        ease: 'easeInOut'
      }}
      className="w-full min-h-full"
    >
      {children}
    </motion.div>
  );
}
