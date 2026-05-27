import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { Play, Palette, Trophy, Sparkles, Check } from 'lucide-react';

const steps = [
  {
    icon: Play,
    title: 'Choose a Match Moment',
    description: 'Pick a World Cup clip or upload your own. Our pose detector finds the action — tracking players, celebrations, and key moments in real time.',
    color: 'from-blue-500/20 to-blue-700/20',
    border: 'border-blue-500/30',
    accent: 'text-blue-400',
    gradient: 'from-blue-600 to-blue-800',
  },
  {
    icon: Palette,
    title: 'Drop AR Overlays',
    description: 'Add flag halos, "GOAL!" lower-thirds, trophy confetti, or animated GIFs — all pose-aware and anchored to the action on screen.',
    color: 'from-purple-500/20 to-purple-700/20',
    border: 'border-purple-500/30',
    accent: 'text-purple-400',
    gradient: 'from-purple-600 to-purple-800',
  },
  {
    icon: Trophy,
    title: 'Mint & Climb the Ranks',
    description: 'One-click mint on X Layer. Top-10 earn USDT daily. Top-3 become Flow Iconic Moments — premium NFTs with NBA Top Shot lineage.',
    color: 'from-green-500/20 to-green-700/20',
    border: 'border-green-500/30',
    accent: 'text-green-400',
    gradient: 'from-green-600 to-green-800',
  },
];

function StepCard({
  step,
  index,
  progress,
  isActive,
}: {
  step: typeof steps[number];
  index: number;
  progress: MotionValue<number>;
  isActive: MotionValue<boolean>;
}) {
  const y = useTransform(progress, [0, 1], [120, 0]);
  const scale = useTransform(progress, [0, 0.5, 1], [0.85, 0.95, 1]);
  const blur = useTransform(progress, [0, 1], [8, 0]);
  const iconScale = useTransform(progress, [0, 0.3, 1], [0.5, 1.2, 1]);
  const numberOpacity = useTransform(progress, [0, 0.3], [0, 1]);

  return (
    <motion.div
      style={{ y, scale, filter: useTransform(blur, (v) => `blur(${v}px)`) }}
      className={`relative rounded-2xl border ${step.border} overflow-hidden backdrop-blur-sm transition-colors h-full`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-60`} />
      <div className="relative p-6 sm:p-8 flex flex-col h-full">
        <div className="flex items-start gap-4 mb-4">
          <motion.div
            style={{ scale: iconScale }}
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}
          >
            <step.icon className={`h-6 w-6 text-white`} />
          </motion.div>
          <motion.span
            style={{ opacity: numberOpacity }}
            className={`text-5xl font-black ${step.accent} opacity-20 leading-none`}
          >
            {String(index + 1).padStart(2, '0')}
          </motion.span>
        </div>

        <h3 className="text-white text-xl sm:text-2xl font-bold mb-3">{step.title}</h3>
        <p className="text-gray-300 text-sm sm:text-base leading-relaxed flex-1">{step.description}</p>

        <motion.div
          style={{ opacity: useTransform(progress, [0.6, 1], [0, 1]) }}
          className="mt-auto pt-4"
        >
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <Check className={`h-3.5 w-3.5 ${step.accent}`} />
            <span className={step.accent}>
              {index === 0 ? 'Pose tracking ready' : index === 1 ? '6 overlay types available' : 'Dual-chain minting'}
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function StepCounter({ current }: { current: MotionValue<number> }) {
  const display = useTransform(current, (v) => Math.min(Math.floor(v + 1), 3));

  return (
    <motion.div className="flex items-center gap-3 mb-10">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: useTransform(current, [i - 0.5, i + 0.5], ['rgba(255,255,255,0.2)', 'rgba(250,204,21,1)']),
              scale: useTransform(current, [i - 0.5, i, i + 0.5], [0.8, 1.3, 0.8]),
            }}
          />
        ))}
      </div>
      <motion.span className="text-sm text-gray-300 font-mono">
        Step <motion.span className="text-yellow-400 font-bold">{display}</motion.span> of 3
      </motion.span>
    </motion.div>
  );
}

export function ScrollRevealSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const stepPhase = useTransform(scrollYProgress, [0, 0.85, 1], [0, 2.99, 3]);
  const step1Progress = useTransform(scrollYProgress, [0, 0.28], [0, 1]);
  const step2Progress = useTransform(scrollYProgress, [0.28, 0.56], [0, 1]);
  const step3Progress = useTransform(scrollYProgress, [0.56, 0.85], [0, 1]);
  const ctaOpacity = useTransform(scrollYProgress, [0.8, 0.95], [0, 1]);
  const ctaY = useTransform(ctaOpacity, [0, 1], [30, 0]);

  const isStep1Active = useTransform(scrollYProgress, [0, 0.28], [true, false]);
  const isStep2Active = useTransform(scrollYProgress, [0.28, 0.56], [false, true]);
  const isStep3Active = useTransform(scrollYProgress, [0.56, 1], [false, true]);

  return (
    <section ref={sectionRef} className="relative h-[350vh]">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <div className="container mx-auto px-4 py-12 w-full">
          <StepCounter current={stepPhase} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {steps.map((step, i) => {
              const progress = [step1Progress, step2Progress, step3Progress][i];
              const isActive = [isStep1Active, isStep2Active, isStep3Active][i];
              return (
                <StepCard
                  key={step.title}
                  step={step}
                  index={i}
                  progress={progress}
                  isActive={isActive}
                />
              );
            })}
          </div>

          <motion.div
            style={{ opacity: ctaOpacity, y: ctaY }}
            className="text-center mt-10"
          >
            <p className="text-yellow-400/80 text-sm font-medium flex items-center justify-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Scroll complete — ready to create your first AR remix
              <Sparkles className="h-3.5 w-3.5" />
            </p>
          </motion.div>
        </div>

        {/* Scroll progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 to-purple-400"
            style={{ scaleX: scrollYProgress, transformOrigin: 'left' }}
          />
        </motion.div>
      </div>
    </section>
  );
}
