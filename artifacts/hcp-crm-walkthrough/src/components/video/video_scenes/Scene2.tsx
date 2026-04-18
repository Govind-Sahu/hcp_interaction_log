import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 4000), // Exit phase
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const screens = [
    { name: 'Dashboard', desc: 'Stats & Charts', icon: '📊', color: '#2563EB' },
    { name: 'HCP List', desc: '8 Doctors, Badges', icon: '👨‍⚕️', color: '#06B6D4' },
    { name: 'Interactions', desc: 'Form + AI Chat', icon: '💬', color: '#10B981' },
    { name: 'HCP Detail', desc: 'Profile + History', icon: '📋', color: '#8B5CF6' },
    { name: 'AI Agent', desc: 'Playground', icon: '🤖', color: '#F59E0B' },
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex w-full h-full p-12 gap-12"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-50%', opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Sidebar Mock */}
      <motion.div 
        className="w-64 h-full bg-[#1E293B]/80 backdrop-blur-md rounded-2xl border border-white/5 flex flex-col p-6 shadow-2xl"
        initial={{ x: -100, opacity: 0 }}
        animate={phase >= 1 ? { x: 0, opacity: 1 } : { x: -100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="w-8 h-8 rounded bg-[#2563EB] mb-12" />
        
        <div className="flex flex-col gap-4">
          {screens.map((screen, i) => (
            <motion.div 
              key={i}
              className="h-10 rounded bg-white/5 w-full flex items-center px-4 gap-3 relative overflow-hidden"
              initial={{ x: -20, opacity: 0 }}
              animate={phase >= 2 ? { x: 0, opacity: 1 } : { x: -20, opacity: 0 }}
              transition={{ delay: phase >= 2 ? i * 0.1 : 0, duration: 0.4 }}
            >
              <span className="text-sm">{screen.icon}</span>
              <div className="h-2 w-20 rounded bg-white/20" />
              
              {/* Highlight active screen simulator */}
              <motion.div 
                className="absolute inset-0 bg-[#2563EB]/20 border-l-2 border-[#2563EB]"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  top: ['0%', '100%']
                }}
                transition={{ 
                  duration: 2, 
                  delay: i * 0.5 + 1,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative">
        <motion.h2 
          className="text-[4vw] font-bold font-display text-white mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          5-Page Structure
        </motion.h2>

        <div className="flex-1 relative">
          {/* Cascading App Cards */}
          {screens.map((screen, i) => (
            <motion.div
              key={i}
              className="absolute w-[60%] h-[60%] rounded-xl border border-white/10 p-8 shadow-2xl backdrop-blur-md flex flex-col"
              style={{ 
                backgroundColor: '#1E293B',
                backgroundImage: `linear-gradient(135deg, ${screen.color}20, transparent)`
              }}
              initial={{ 
                x: '50vw', 
                y: '20vh', 
                scale: 0.8, 
                rotateY: -30,
                opacity: 0,
                zIndex: i 
              }}
              animate={phase >= 3 ? {
                x: `${i * 12}%`,
                y: `${i * 8}%`,
                scale: 1 - (i * 0.05),
                rotateY: -15 + (i * 2),
                opacity: 1 - (i * 0.1),
              } : {}}
              transition={{ 
                type: 'spring', 
                stiffness: 150, 
                damping: 20, 
                delay: phase >= 3 ? i * 0.1 : 0 
              }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: `${screen.color}40`, color: screen.color }}>
                  {screen.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-display text-white">{screen.name}</h3>
                  <p className="text-[#94A3B8]">{screen.desc}</p>
                </div>
              </div>

              {/* Wireframe UI */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="h-32 w-full rounded-lg bg-white/5 border border-white/5" />
                <div className="flex gap-4">
                  <div className="h-24 w-1/3 rounded-lg bg-white/5 border border-white/5" />
                  <div className="h-24 w-1/3 rounded-lg bg-white/5 border border-white/5" />
                  <div className="h-24 w-1/3 rounded-lg bg-white/5 border border-white/5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}