'use client';
import { motion } from 'framer-motion';

export default function GradientMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
      {/* Primary blue orb — smaller on mobile to prevent horizontal scroll */}
      <motion.div
        className="absolute w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
          top: '-100px',
          right: '-50px',
          filter: 'blur(60px)',
          willChange: 'transform',
        }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      {/* Violet orb */}
      <motion.div
        className="absolute w-[250px] h-[250px] sm:w-[500px] sm:h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%)',
          bottom: '-75px',
          left: '-50px',
          filter: 'blur(60px)',
          willChange: 'transform',
        }}
        animate={{
          x: [0, -25, 20, 0],
          y: [0, 25, -15, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      />
      {/* Subtle center glow */}
      <div
        className="absolute w-[400px] h-[200px] sm:w-[800px] sm:h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse, rgba(37, 99, 235, 0.05) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(60px)',
        }}
      />
    </div>
  );
}
