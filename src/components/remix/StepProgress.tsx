import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface StepProgressProps {
  current: number;
  total: number;
  labels: string[];
}

export function StepProgress({ current, total, labels }: StepProgressProps) {
  return (
    <div className="w-full px-3 py-4 sm:px-4 sm:py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between sm:items-center gap-1 sm:gap-0">
          {Array.from({ length: total }).map((_, i) => (
            <React.Fragment key={i}>
              <motion.div
                className="flex flex-col items-center min-w-0"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <motion.div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-colors shrink-0 ${
                    i < current
                      ? 'bg-green-500 text-white'
                      : i === current
                      ? 'bg-yellow-400 text-black ring-2 ring-yellow-400/50'
                      : 'bg-white/10 text-gray-400'
                  }`}
                  animate={i === current ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
                >
                  {i < current ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                    </motion.div>
                  ) : (
                    i + 1
                  )}
                </motion.div>
                <motion.span
                  className={`mt-1 sm:mt-2 text-[10px] sm:text-xs font-medium text-center truncate max-w-[60px] sm:max-w-none ${
                    i === current ? 'text-yellow-400' : i < current ? 'text-green-400' : 'text-gray-500'
                  }`}
                  animate={i === current ? { opacity: [0.6, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                >
                  {labels.length > i ? labels[i] : ''}
                </motion.span>
              </motion.div>

              {i < total - 1 && (
                <motion.div
                  className={`flex-1 h-0.5 mx-1 sm:mx-4 rounded-full mt-4 sm:mt-5 ${
                    i < current ? 'bg-green-500' : 'bg-white/10'
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: i * 0.1 + 0.2, duration: 0.3 }}
                  style={{ transformOrigin: 'left' }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
