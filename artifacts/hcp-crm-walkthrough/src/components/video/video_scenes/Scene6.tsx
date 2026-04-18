import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800), // Points appear
      setTimeout(() => setPhase(3), 4000), // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const insights = [
    "LangGraph enables multi-tool AI agents that chain actions naturally",
    "Groq's llama-3.3-70b is fast enough for real-time chat interfaces",
    "OpenAPI-first design creates type-safe contracts between layers",
    "Redux state management bridges form/chat modes seamlessly",
    "The dual-interface (form + AI) makes CRM data capture frictionless"
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center w-full h-full p-12"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: '-100%' }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <div className="max-w-5xl w-full z-10">
        <motion.h2 
          className="text-[3vw] font-bold font-display text-white mb-12 border-b border-white/10 pb-6 inline-block"
          initial={{ opacity: 0, x: -50 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
        >
          Task 1 <span className="text-[#06B6D4]">Learnings</span>
        </motion.h2>

        <div className="flex flex-col gap-6">
          {insights.map((text, i) => (
            <motion.div 
              key={i}
              className="flex items-start gap-4 text-xl md:text-2xl text-white/90"
              initial={{ opacity: 0, x: 50 }}
              animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ duration: 0.6, delay: phase >= 2 ? i * 0.15 : 0 }}
            >
              <div className="mt-1.5 w-3 h-3 rounded-full bg-[#10B981] shadow-[0_0_10px_#10B981] shrink-0" />
              <p>{text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}