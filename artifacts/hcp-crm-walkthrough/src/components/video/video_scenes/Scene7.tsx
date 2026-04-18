import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 2000), // Loop exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center w-full h-full bg-[#0F1724]"
      initial={{ opacity: 0, scale: 1.2 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <motion.div 
        className="text-center z-10 flex flex-col items-center"
        initial={{ y: 30, opacity: 0 }}
        animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-[5vw] font-bold font-display text-white mb-2">
          Built with Replit
        </h2>
        
        <motion.div 
          className="h-[2px] bg-gradient-to-r from-transparent via-[#2563EB] to-transparent w-full max-w-lg mb-6"
          initial={{ scaleX: 0 }}
          animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
        />

        <div className="flex gap-6 text-[#94A3B8] text-xl font-mono items-center justify-center">
          <motion.span
             initial={{ opacity: 0, y: 10 }}
             animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
             transition={{ delay: 0.6 }}
          >
            HCP CRM
          </motion.span>
          <motion.span className="text-[#06B6D4]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>/</motion.span>
          <motion.span
             initial={{ opacity: 0, y: 10 }}
             animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
             transition={{ delay: 0.9 }}
          >
            LangGraph + Groq
          </motion.span>
          <motion.span className="text-[#06B6D4]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>/</motion.span>
          <motion.span
             initial={{ opacity: 0, y: 10 }}
             animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
             transition={{ delay: 1.2 }}
          >
            React + FastAPI
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
}