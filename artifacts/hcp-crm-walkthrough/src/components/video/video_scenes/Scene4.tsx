import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000), // Tools appear
      setTimeout(() => setPhase(3), 3500), // Chain animation starts
      setTimeout(() => setPhase(4), 6000), // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const tools = [
    { name: 'log_interaction', desc: 'Captures + AI-summarizes data' },
    { name: 'edit_interaction', desc: 'Modifies existing records' },
    { name: 'search_hcp', desc: 'Finds HCPs by territory' },
    { name: 'get_interaction_history', desc: 'Retrieves full history' },
    { name: 'schedule_follow_up', desc: 'Sets follow-up reminders' },
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col w-full h-full p-12 overflow-hidden bg-[#0F1724]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: 100 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        className="mb-12 text-center"
        initial={{ y: -30, opacity: 0 }}
        animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: -30, opacity: 0 }}
      >
        <h2 className="text-[3.5vw] font-bold font-display text-white">LangGraph Tools</h2>
        <p className="text-[#06B6D4] text-xl mt-2">Chaining Actions Automatically</p>
      </motion.div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 relative">
        
        {/* Connection Path line background */}
        <motion.div 
          className="absolute top-[20%] bottom-[20%] w-[2px] bg-white/10 left-1/2 -translate-x-1/2 -z-10"
          initial={{ scaleY: 0 }}
          animate={phase >= 2 ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: 1.5 }}
        />

        {/* Chaining active energy line */}
        {phase >= 3 && (
          <motion.div 
            className="absolute w-[4px] bg-[#06B6D4] left-1/2 -translate-x-1/2 shadow-[0_0_15px_#06B6D4] -z-10 rounded-full"
            initial={{ top: '15%', height: 0, opacity: 1 }}
            animate={{ top: '85%', height: 40, opacity: 0 }}
            transition={{ duration: 2, ease: "linear", repeat: Infinity }}
          />
        )}

        {tools.map((tool, i) => {
          const isLeft = i % 2 === 0;
          return (
            <motion.div 
              key={i}
              className={`flex w-full items-center ${isLeft ? 'justify-start' : 'justify-end'} relative max-w-4xl`}
              initial={{ x: isLeft ? -100 : 100, opacity: 0 }}
              animate={phase >= 2 ? { x: 0, opacity: 1 } : { x: isLeft ? -100 : 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: phase >= 2 ? i * 0.3 : 0 }}
            >
              {/* Connector dots */}
              <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#1E293B] border-2 border-[#2563EB] z-10" />

              <motion.div 
                className="w-[40%] bg-[#1E293B] border border-[#2563EB]/40 rounded-xl p-5 shadow-lg relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                animate={phase >= 3 ? {
                  borderColor: ['#2563EB40', '#06B6D4', '#2563EB40'],
                  boxShadow: ['0 0 0 rgba(6,182,212,0)', '0 0 20px rgba(6,182,212,0.4)', '0 0 0 rgba(6,182,212,0)']
                } : {}}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: i * 0.4 // cascade effect
                }}
              >
                <div className="font-mono text-[#06B6D4] text-lg mb-1">{tool.name}</div>
                <div className="text-[#94A3B8] text-sm">{tool.desc}</div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}