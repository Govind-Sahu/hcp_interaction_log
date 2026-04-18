import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000), // Layers build
      setTimeout(() => setPhase(3), 3500), // Data flow
      setTimeout(() => setPhase(4), 5000), // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const layers = [
    { title: 'Frontend', tech: 'React + Redux + React Query', color: '#38BDF8', gradient: 'from-[#38BDF8]/20 to-transparent' },
    { title: 'API Gateway', tech: 'Node.js Fastify API Server', color: '#2563EB', gradient: 'from-[#2563EB]/20 to-transparent' },
    { title: 'AI Backend', tech: 'Python FastAPI + LangGraph', color: '#06B6D4', gradient: 'from-[#06B6D4]/20 to-transparent' },
    { title: 'Database / LLM', tech: 'PostgreSQL + Drizzle | Groq: llama-3.3', color: '#10B981', gradient: 'from-[#10B981]/20 to-transparent' },
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center w-full h-full p-12 perspective-[1000px]"
      initial={{ opacity: 0, rotateX: -10 }}
      animate={{ opacity: 1, rotateX: 0 }}
      exit={{ opacity: 0, rotateX: 20, scale: 0.8 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="w-full max-w-4xl relative transform-style-3d rotate-x-[15deg]">
        <motion.div 
          className="text-center mb-16"
          initial={{ y: -50, opacity: 0 }}
          animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: -50, opacity: 0 }}
        >
          <h2 className="text-[3.5vw] font-bold font-display text-white">Full Stack Architecture</h2>
          <p className="text-[#94A3B8] text-xl mt-2 font-mono">OpenAPI spec → orval codegen → typed hooks</p>
        </motion.div>

        <div className="flex flex-col gap-6 relative">
          {layers.map((layer, i) => (
            <motion.div
              key={i}
              className={`w-full p-6 rounded-xl border-l-4 bg-gradient-to-r ${layer.gradient} bg-[#1E293B]/60 backdrop-blur-sm border-white/5 relative shadow-xl`}
              style={{ borderLeftColor: layer.color }}
              initial={{ opacity: 0, y: 50, rotateX: 20 }}
              animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 50, rotateX: 20 }}
              transition={{ type: 'spring', stiffness: 100, damping: 15, delay: phase >= 2 ? i * 0.2 : 0 }}
            >
              <h3 className="text-xl font-bold text-white mb-1" style={{ color: layer.color }}>{layer.title}</h3>
              <p className="text-lg text-white/80 font-mono text-sm">{layer.tech}</p>

              {/* Data Flow Particles */}
              {phase >= 3 && i < layers.length - 1 && (
                <motion.div 
                  className="absolute -bottom-6 left-12 w-1 h-8 bg-gradient-to-b from-transparent to-white rounded-full z-20"
                  animate={{ y: [0, 40], opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                  style={{ background: `linear-gradient(to bottom, transparent, ${layer.color})` }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}