'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'

export function DemoBanner({ message = 'Preview mode — data shown is example content. Connect wallet and backend to see live data.' }: { message?: string }) {
  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/30">
      <div className="container mx-auto px-4 py-2 flex items-center gap-2 justify-center">
        <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
        <p className="text-yellow-300 text-[11px] leading-tight">{message}</p>
      </div>
    </div>
  )
}
