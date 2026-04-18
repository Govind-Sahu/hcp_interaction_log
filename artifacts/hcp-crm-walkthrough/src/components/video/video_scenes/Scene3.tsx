import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1000), // Typing starts
      setTimeout(() => setPhase(3), 2000), // AI processing
      setTimeout(() => setPhase(4), 2800), // Form fills
      setTimeout(() => setPhase(5), 4200), // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col w-full h-full p-12 bg-gradient-to-br from-[#0F1724] to-[#1E293B]"
      initial={{ scale: 1.1, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0, y: -50 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div 
        className="mb-8"
        initial={{ y: -20, opacity: 0 }}
        animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: -20, opacity: 0 }}
      >
        <h2 className="text-[3.5vw] font-bold font-display text-white">Log Interaction</h2>
        <p className="text-[#06B6D4] text-xl">The Signature Split-Panel Screen</p>
      </motion.div>

      <div className="flex-1 flex gap-8">
        {/* LEFT: Structured Form */}
        <motion.div 
          className="flex-1 bg-[#0F1724]/80 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex flex-col gap-4 shadow-2xl relative overflow-hidden"
          initial={{ x: -50, opacity: 0 }}
          animate={phase >= 1 ? { x: 0, opacity: 1 } : { x: -50, opacity: 0 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          <div className="absolute top-0 right-0 p-3 bg-[#2563EB]/20 text-[#2563EB] text-xs font-bold uppercase tracking-wider rounded-bl-lg">
            Structured Data
          </div>
          
          {[
            { label: 'HCP Name', filled: 'Dr. Sarah Chen' },
            { label: 'Interaction Type', filled: 'In-Person Visit' },
            { label: 'Date/Time', filled: 'Oct 24, 2023 - 10:00 AM' },
            { label: 'Topics', filled: 'New clinical trial data' },
            { label: 'Materials Left', filled: 'Efficacy brochure' }
          ].map((field, i) => (
            <div key={i} className="flex flex-col gap-2">
              <label className="text-xs text-[#64748B] uppercase tracking-wider">{field.label}</label>
              <div className="h-12 w-full bg-[#1E293B] rounded-lg border border-white/5 flex items-center px-4 relative overflow-hidden">
                {/* Form fields fill automatically */}
                <motion.div 
                  className="absolute inset-0 bg-[#10B981]/20"
                  initial={{ x: '-100%' }}
                  animate={phase >= 4 ? { x: '0%' } : { x: '-100%' }}
                  transition={{ duration: 0.5, delay: phase >= 4 ? i * 0.1 : 0 }}
                />
                <motion.span 
                  className="text-white font-medium z-10"
                  initial={{ opacity: 0 }}
                  animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: phase >= 4 ? i * 0.1 + 0.2 : 0 }}
                >
                  {field.filled}
                </motion.span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Divider / Connector */}
        <div className="w-12 flex flex-col items-center justify-center relative">
          <motion.div 
            className="w-full h-[2px] bg-gradient-to-r from-[#10B981] to-[#06B6D4]"
            initial={{ scaleX: 0 }}
            animate={phase >= 3 ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.8 }}
          />
          <motion.div 
            className="absolute p-2 rounded-full bg-[#0F1724] border-2 border-[#06B6D4] text-[#06B6D4]"
            initial={{ scale: 0 }}
            animate={phase >= 3 ? { scale: 1 } : { scale: 0 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            ←
          </motion.div>
        </div>

        {/* RIGHT: AI Assistant */}
        <motion.div 
          className="flex-1 bg-[#1E293B]/80 backdrop-blur-md rounded-2xl border border-[#06B6D4]/30 p-6 flex flex-col shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden"
          initial={{ x: 50, opacity: 0 }}
          animate={phase >= 1 ? { x: 0, opacity: 1 } : { x: 50, opacity: 0 }}
          transition={{ type: 'spring', delay: 0.4 }}
        >
          <div className="absolute top-0 left-0 p-3 bg-[#06B6D4]/20 text-[#06B6D4] text-xs font-bold uppercase tracking-wider rounded-br-lg">
            AI Assistant
          </div>

          <div className="flex-1 mt-8 flex flex-col gap-4 justify-end pb-16 relative">
            <motion.div 
              className="self-end bg-[#2563EB] text-white p-4 rounded-2xl rounded-tr-sm max-w-[80%]"
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 1 }}
              >
                Met with Dr. Chen at 10am. Discussed the new trial data and left the efficacy brochure.
              </motion.span>
            </motion.div>

            {/* AI typing indicator */}
            {phase >= 3 && phase < 4 && (
              <motion.div 
                className="self-start bg-white/10 p-4 rounded-2xl rounded-tl-sm w-16 flex justify-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div className="w-2 h-2 rounded-full bg-[#06B6D4]" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} />
                <motion.div className="w-2 h-2 rounded-full bg-[#06B6D4]" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                <motion.div className="w-2 h-2 rounded-full bg-[#06B6D4]" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
              </motion.div>
            )}

            <motion.div 
              className="self-start bg-[#0F1724] border border-[#06B6D4]/30 text-white p-4 rounded-2xl rounded-tl-sm max-w-[80%]"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={phase >= 4 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: 'spring' }}
            >
              <div className="flex items-center gap-2 mb-2 text-[#10B981] text-sm font-bold">
                ✓ Form Auto-Filled
              </div>
              I've extracted the structured data from your note.
            </motion.div>
          </div>

          <div className="absolute bottom-6 left-6 right-6 h-12 rounded-full bg-[#0F1724] border border-white/10 flex items-center px-4">
            <div className="w-4 h-4 rounded-full bg-[#06B6D4] opacity-50 mr-3" />
            <span className="text-[#64748B]">Type naturally...</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}