'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Zap, Sparkles, Palette, Trophy, Users, Music,
  Sword, Dumbbell, Waves, ArrowRight, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MascotCharacter } from './MascotCharacter';

const ONBOARDING_KEY = 'magiclens_onboarding_complete';
const PREFS_KEY = 'magiclens_user_prefs';

const vibeOptions = [
  { id: 'create', icon: Zap, label: 'Create AR Remixes', desc: 'Drop overlays on match clips' },
  { id: 'collect', icon: Trophy, label: 'Collect NFTs', desc: 'Browse & mint iconic moments' },
  { id: 'collab', icon: Users, label: 'Collaborate', desc: 'Remix with other creators' },
  { id: 'explore', icon: Sparkles, label: 'Just Exploring', desc: 'See what\'s possible' },
];

const sportOptions = [
  { id: 'worldcup', icon: Zap, label: 'World Cup', color: 'from-yellow-500/20 to-yellow-700/20' },
  { id: 'nba', icon: Dumbbell, label: 'NBA', color: 'from-red-500/20 to-red-700/20' },
  { id: 'f1', icon: Waves, label: 'F1', color: 'from-red-600/20 to-red-800/20' },
  { id: 'wimbledon', icon: Zap, label: 'Wimbledon', color: 'from-green-500/20 to-green-700/20' },
  { id: 'nfl', icon: Sword, label: 'NFL', color: 'from-blue-500/20 to-blue-700/20' },
  { id: 'olympics', icon: Music, label: 'Olympics', color: 'from-purple-500/20 to-purple-700/20' },
];

const mascotMessages: Record<number, { text: string; mood: 'waving' | 'happy' | 'thinking' | 'celebrate' | 'idle' }> = {
  0: { text: "Hey there! I'm Lens — your AR remix guide! Let me show you around MagicLens.", mood: 'waving' },
  1: { text: "What brings you here? Pick whatever feels right — you can change anytime!", mood: 'happy' },
  2: { text: "Which sports get you hyped? Follow what you love!", mood: 'thinking' },
  3: { text: "Here's how it works in 3 quick steps...", mood: 'happy' },
  4: { text: "You're all set! Let's make some iconic moments 🎉", mood: 'celebrate' },
};

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <MascotCharacter mood="waving" size={120} />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl sm:text-3xl font-bold text-white mt-6"
      >
        Welcome to <span className="text-yellow-400">MagicLens</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-gray-400 mt-3 max-w-sm"
      >
        The AR remix layer for live sports. Drop pose-aware overlays on match clips, mint them as NFTs, and earn rewards.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-8"
      >
        <Button onClick={onNext} size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500 px-8 text-base">
          Let's Go! <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}

function VibeStep({ selected, onSelect, onNext }: { selected: string[]; onSelect: (id: string) => void; onNext: () => void }) {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto"
      >
        {vibeOptions.map((opt, i) => {
          const isSelected = selected.includes(opt.id);
          return (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelect(opt.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-yellow-400/10 border-yellow-400/40 ring-1 ring-yellow-400/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                isSelected ? 'bg-yellow-400/20' : 'bg-white/5'
              }`}>
                <opt.icon className={`h-5 w-5 ${isSelected ? 'text-yellow-400' : 'text-gray-400'}`} />
              </div>
              <div className="font-medium text-white text-sm">{opt.label}</div>
              <div className="text-gray-500 text-xs mt-0.5">{opt.desc}</div>
            </motion.button>
          );
        })}
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: selected.length > 0 ? 1 : 0.3 }}
        className="flex justify-center mt-6"
      >
        <Button
          onClick={onNext}
          disabled={selected.length === 0}
          size="lg"
          className="bg-yellow-400 text-black hover:bg-yellow-500 px-8 text-base"
        >
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}

function SportsStep({ selected, onToggle, onNext, onSkip }: { selected: string[]; onToggle: (id: string) => void; onNext: () => void; onSkip: () => void }) {
  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
        {sportOptions.map((sport, i) => {
          const isSelected = selected.includes(sport.id);
          return (
            <motion.button
              key={sport.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => onToggle(sport.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all text-sm ${
                isSelected
                  ? `bg-gradient-to-r ${sport.color} border-yellow-400/40 text-white`
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200'
              }`}
            >
              <sport.icon className="h-3.5 w-3.5" />
              {sport.label}
              {isSelected && <Check className="h-3 w-3 text-yellow-400" />}
            </motion.button>
          );
        })}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center gap-3 mt-8"
      >
        <Button onClick={onSkip} variant="ghost" className="text-gray-400 hover:text-white">
          Skip
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="bg-yellow-400 text-black hover:bg-yellow-500 px-8 text-base"
        >
          {selected.length > 0 ? 'Next' : 'Skip'} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}

function TourStep({ onNext }: { onNext: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (phase < 2) setPhase(phase + 1);
    }, 2200);
    return () => clearTimeout(timer);
  }, [phase]);

  const tourIcons = [Zap, Palette, Trophy];
  const IconComponent = tourIcons[phase];
  const tourSteps = [
    {
      title: 'Pick a Match Clip',
      desc: 'Choose a World Cup moment or upload your own video. Our pose tracker finds the action automatically.',
      gradient: 'from-blue-500 to-blue-700',
    },
    {
      title: 'Drop AR Overlays',
      desc: 'Add flag halos, GOAL! effects, confetti, and more — all anchored to player poses in real time.',
      gradient: 'from-purple-500 to-purple-700',
    },
    {
      title: 'Mint & Earn',
      desc: 'One-click mint on X Layer. Top remixes earn USDT rewards and become Flow Iconic Moments.',
      gradient: 'from-green-500 to-green-700',
    },
  ];

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex justify-center gap-2 mb-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 rounded-full"
            animate={{
              width: i <= phase ? 32 : 8,
              backgroundColor: i <= phase ? '#facc15' : 'rgba(255,255,255,0.15)',
            }}
            transition={{ duration: 0.4 }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35 }}
        >
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tourSteps[phase].gradient} flex items-center justify-center mb-4`}>
              <IconComponent className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-white font-bold text-lg mb-1">{tourSteps[phase].title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{tourSteps[phase].desc}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 2 ? 1 : 0.3 }}
        className="flex justify-center mt-6"
      >
        <Button
          onClick={onNext}
          size="lg"
          className="bg-yellow-400 text-black hover:bg-yellow-500 px-8 text-base"
        >
          Got it! <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}

function ReadyStep({ prefs, onFinish }: { prefs: { vibes: string[]; sports: string[] }; onFinish: () => void }) {
  const router = useRouter();

  const handleFinish = () => {
    onFinish();
    router.push('/dashboard?onboarded=true');
  };

  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
      >
        <MascotCharacter mood="celebrate" size={120} />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-2xl font-bold text-white mt-6"
      >
        You're All Set! 🎉
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-gray-400 mt-2 max-w-sm"
      >
        {prefs.vibes.includes('create')
          ? 'Head to the remix studio to create your first AR moment!'
          : prefs.vibes.includes('collect')
          ? 'Browse the gallery to discover and collect iconic moments.'
          : 'Your personalized dashboard is ready — start exploring!'}
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-8"
      >
        <Button onClick={handleFinish} size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500 px-8 text-base">
          <Zap className="mr-2 h-4 w-4" /> Start Creating
        </Button>
      </motion.div>
    </div>
  );
}

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [vibes, setVibes] = useState<string[]>([]);
  const [sports, setSports] = useState<string[]>([]);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    localStorage.setItem(PREFS_KEY, JSON.stringify({ vibes, sports }));
    setVisible(false);
  }, [vibes, sports]);

  const toggleVibe = useCallback((id: string) => {
    setVibes((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
  }, []);

  const toggleSport = useCallback((id: string) => {
    setSports((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }, []);

  if (!visible) return null;

  const msg = mascotMessages[step] || mascotMessages[0];

  const stepComponents = [
    <WelcomeStep key="welcome" onNext={() => setStep(1)} />,
    <VibeStep key="vibe" selected={vibes} onSelect={toggleVibe} onNext={() => setStep(2)} />,
    <SportsStep key="sports" selected={sports} onToggle={toggleSport} onNext={() => setStep(3)} onSkip={() => setStep(3)} />,
    <TourStep key="tour" onNext={() => setStep(4)} />,
    <ReadyStep key="ready" prefs={{ vibes, sports }} onFinish={completeOnboarding} />,
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-gray-950 via-purple-950/90 to-gray-950 overflow-y-auto"
    >
      <div className="w-full max-w-lg mx-auto px-4 py-12">
        {/* Mascot message bubble */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-start gap-3 mb-8 max-w-sm mx-auto"
        >
          <MascotCharacter mood={msg.mood} size={40} />
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 border border-white/10 flex-1">
            <p className="text-gray-200 text-sm leading-relaxed">{msg.text}</p>
          </div>
        </motion.div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {stepComponents[step]}
          </motion.div>
        </AnimatePresence>

        {/* Step indicator */}
        <div className="flex justify-center gap-1.5 mt-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="h-1.5 rounded-full"
              animate={{
                width: i === step ? 20 : 6,
                backgroundColor: i <= step ? '#facc15' : 'rgba(255,255,255,0.12)',
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
