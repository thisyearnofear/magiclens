import React from 'react';
import { Button } from '@/components/ui/button';

interface GettingStartedChecklistProps {
  onNavigate: (path: string) => void;
}

const steps = [
  {
    number: 1,
    color: 'bg-blue-500',
    title: 'Update your profile',
    description: 'Set your username and bio',
    path: '/profile',
  },
  {
    number: 2,
    color: 'bg-green-500',
    title: 'Upload your first video',
    description: 'Share environmental footage',
    path: '/upload-video',
  },
  {
    number: 3,
    color: 'bg-purple-500',
    title: 'Explore asset library',
    description: 'Find overlays and animations',
    path: '/assets',
  },
  {
    number: 4,
    color: 'bg-yellow-500',
    title: 'Browse collaborations',
    description: 'Connect with other creators',
    path: '/videos',
  },
];

export function GettingStartedChecklist({ onNavigate }: GettingStartedChecklistProps) {
  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-4 md:p-6">
        <h3 className="text-lg font-bold text-white mb-4">Welcome to MagicLens! 🎉</h3>
        <p className="text-gray-300 text-sm mb-4">
          Get started with these quick steps to make the most of your experience:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex items-start space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div
                className={`w-5 h-5 sm:w-6 sm:h-6 ${step.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}
              >
                {step.number}
              </div>
              <div className="flex-1 min-w-0">
                <Button
                  variant="ghost"
                  onClick={() => onNavigate(step.path)}
                  className="text-white hover:bg-white/10 p-0 h-auto justify-start w-full text-left"
                >
                  <div>
                    <div className="font-medium text-sm sm:text-base">{step.title}</div>
                    <div className="text-gray-300 text-xs sm:text-sm">{step.description}</div>
                  </div>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
