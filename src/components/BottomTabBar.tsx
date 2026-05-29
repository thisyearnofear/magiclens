'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Home, Trophy, Sparkles, Zap, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/remix', label: 'Create', icon: Zap },
  { href: '/leaderboard', label: 'Compete', icon: Trophy },
  { href: '/iconic-moments', label: 'Gallery', icon: Sparkles },
  { href: '/discover', label: 'Discover', icon: Users },
  { href: '/profile', label: 'Profile', icon: Home },
]

export function BottomTabBar() {
  const router = useRouter()
  const pathname = usePathname()

  const hiddenPaths = ['/', '/upload-video', '/upload-asset']

  if (hiddenPaths.includes(pathname)) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 block sm:hidden bg-gray-900/95 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-0',
                isActive
                  ? 'text-yellow-400'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
