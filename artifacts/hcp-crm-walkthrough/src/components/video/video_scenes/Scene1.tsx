import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 3200), // Exit drift
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center w-full h-full"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl px-8">
        {/* Status Badge */}
        <motion.div 
          className="mb-8 px-4 py-1.5 rounded-full border border-[#06B6D4]/30 bg-[#06B6D4]/10 backdrop-blur-sm flex items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-2 h-2 rounded-full bg-[#06B6D4] shadow-[0_0_8px_#06B6D4]" />
          <span className="text-[#06B6D4] text-sm font-display tracking-widest uppercase">Pharma Field Sales</span>
        </motion.div>

        {/* Main Title */}
        <motion.h1 
          className="text-[6vw] font-bold text-white leading-tight font-display tracking-tight"
        >
          {'AI-First'.split('').map((char, i) => (
            <motion.span 
              key={i} 
              className="inline-block text-[#06B6D4]"
              initial={{ opacity: 0, y: 40, rotateX: -60 }}
              animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 40, rotateX: -60 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: phase >= 2 ? i * 0.05 : 0 }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
          <br />
          {'HCP CRM'.split('').map((char, i) => (
            <motion.span 
              key={`hcp-${i}`} 
              className="inline-block"
              initial={{ opacity: 0, y: 40, rotateX: -60 }}
              animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 40, rotateX: -60 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: phase >= 2 ? 0.4 + (i * 0.05) : 0 }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </motion.h1>

        {/* Stack Tech */}
        <motion.div 
          className="mt-8 flex gap-4 text-lg text-[#94A3B8]"
          initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
          animate={phase >= 3 ? { opacity: 1, filter: 'blur(0px)', y: 0 } : { opacity: 0, filter: 'blur(10px)', y: 20 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span>React</span>
          <span className="text-[#2563EB]">•</span>
          <span>LangGraph</span>
          <span className="text-[#2563EB]">•</span>
          <span>Groq</span>
        </motion.div>
      </div>

      {/* Decorative background elements that animate out early */}
      <motion.div 
        className="absolute top-[20%] left-[10%] w-64 h-64 border border-[#2563EB]/20 rounded-full"
        animate={{ 
          scale: phase >= 4 ? 0 : [1, 1.2, 1],
          opacity: phase >= 4 ? 0 : 0.3
        }}
        transition={{ duration: phase >= 4 ? 0.8 : 4, repeat: phase >= 4 ? 0 : Infinity }}
      />
    </motion.div>
  );
}