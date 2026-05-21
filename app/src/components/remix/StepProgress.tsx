import React from 'react';
import { Check } from 'lucide-react';

interface StepProgressProps {
  current: number;
  total: number;
  labels: string[];
}

export function StepProgress({ current, total, labels }: StepProgressProps) {
  return (
    <div className="w-full px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          {Array.from({ length: total }).map((_, i) => (
            <React.Fragment key={i}>
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    i < current
                      ? 'bg-green-500 text-white'
                      : i === current
                      ? 'bg-yellow-400 text-black ring-2 ring-yellow-400/50'
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {i < current ? <Check className="h-5 w-5" /> : i + 1}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    i === current ? 'text-yellow-400' : i < current ? 'text-green-400' : 'text-gray-500'
                  }`}
                >
                  {labels[i]}
                </span>
              </div>
              {/* Connector line */}
              {i < total - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${
                    i < current ? 'bg-green-500' : 'bg-white/10'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
