'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: string;
  className?: string;
}

export default function AnimatedCounter({ value, className = '' }: AnimatedCounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    if (!isInView) return;
    const numericMatch = value.match(/(\d+)/);
    if (!numericMatch) { setDisplayValue(value); return; }

    const target = parseInt(numericMatch[1]);
    const prefix = value.slice(0, value.indexOf(numericMatch[1]));
    const suffix = value.slice(value.indexOf(numericMatch[1]) + numericMatch[1].length);
    const duration = 1500;
    const start = Date.now();

    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(target * eased);
      setDisplayValue(`${prefix}${current}${suffix}`);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {displayValue}
    </motion.span>
  );
}
