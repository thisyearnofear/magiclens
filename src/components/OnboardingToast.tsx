'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Zap, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'magiclens_onboarding_seen'

export function OnboardingToast() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen) {
      const timer = setTimeout(() => setVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 80, x: '-50%' }}
          className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-32px)] max-w-md"
        >
          <div className="bg-gray-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-yellow-400/20 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="h-4 w-4 text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-sm font-semibold">Welcome to MagicLens</h4>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  Try remixing a World Cup moment — pick a clip, drop AR overlays, and mint it as an NFT.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => { dismiss(); router.push('/remix'); }}
                    className="bg-yellow-400 text-black hover:bg-yellow-500 text-xs h-8 px-3"
                  >
                    <Zap className="h-3 w-3 mr-1" /> Try It Now
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { dismiss(); router.push('/leaderboard'); }}
                    className="text-gray-300 hover:text-white text-xs h-8 px-3"
                  >
                    View Leaderboard
                  </Button>
                </div>
              </div>
              <button onClick={dismiss} className="text-gray-500 hover:text-white shrink-0 mt-0.5">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
