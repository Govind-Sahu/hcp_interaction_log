import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';
import { Scene7 } from './video_scenes/Scene7';

const SCENE_DURATIONS = { 
  intro: 4000, 
  frontend: 5000, 
  log: 5000, 
  tools: 7000, 
  architecture: 6000, 
  learnings: 5000, 
  outro: 3000 
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0F1724]">
      {/* Persistent Background Layer */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #2563EB, transparent)' }}
          animate={{ 
            x: ['-20%', '80%', '-10%', '50%'][currentScene % 4], 
            y: ['-10%', '60%', '80%', '10%'][currentScene % 4],
            scale: [1, 1.2, 0.8, 1.1][currentScene % 4]
          }}
          transition={{ duration: 4, ease: 'easeInOut' }} 
        />
        <motion.div 
          className="absolute w-[600px] h-[600px] rounded-full opacity-15 blur-3xl right-0 bottom-0"
          style={{ background: 'radial-gradient(circle, #06B6D4, transparent)' }}
          animate={{ 
            x: ['20%', '-60%', '10%', '-40%'][currentScene % 4], 
            y: ['-20%', '-40%', '20%', '50%'][currentScene % 4] 
          }}
          transition={{ duration: 5, ease: 'easeInOut' }} 
        />
        {/* Persistent grid texture overlay */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%232563EB' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Persistent Accent Elements */}
      <motion.div
        className="absolute h-[1px] bg-[#06B6D4] z-10"
        animate={{
          left: ['0%', '20%', '0%', '40%', '10%', '0%', '0%'][currentScene] || '0%',
          width: ['100%', '40%', '80%', '20%', '60%', '100%', '100%'][currentScene] || '100%',
          top: ['10%', '15%', '85%', '50%', '90%', '20%', '50%'][currentScene] || '10%',
          opacity: [0.5, 0.8, 0.3, 0.9, 0.4, 0.6, 0.1][currentScene] || 0.5,
        }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="absolute w-12 h-12 border border-[#2563EB] rounded-sm z-10"
        animate={{
          x: ['80vw', '10vw', '85vw', '50vw', '20vw', '90vw', '50vw'][currentScene] || '80vw',
          y: ['20vh', '80vh', '15vh', '10vh', '85vh', '80vh', '50vh'][currentScene] || '20vh',
          rotate: [0, 45, 90, 135, 180, 225, 270][currentScene] || 0,
          scale: [1, 1.5, 0.8, 2, 1, 1.2, 0][currentScene] || 1,
          opacity: currentScene === 6 ? 0 : 0.4
        }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />

      <div className="relative z-20 w-full h-full">
        <AnimatePresence mode="popLayout">
          {currentScene === 0 && <Scene1 key="intro" />}
          {currentScene === 1 && <Scene2 key="frontend" />}
          {currentScene === 2 && <Scene3 key="log" />}
          {currentScene === 3 && <Scene4 key="tools" />}
          {currentScene === 4 && <Scene5 key="architecture" />}
          {currentScene === 5 && <Scene6 key="learnings" />}
          {currentScene === 6 && <Scene7 key="outro" />}
        </AnimatePresence>
      </div>
    </div>
  );
}