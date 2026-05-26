'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Sheet, SheetContent, SheetTrigger, SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu, Home, Trophy, Users, Zap, User, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/discover', label: 'Discover', icon: Users },
  { href: '/remix', label: 'Create Remix', icon: Zap },
  { href: '/profile', label: 'Profile', icon: User },
]

interface MobileNavProps {
  title: string
  icon?: React.ReactNode
}

export function MobileNav({ title, icon }: MobileNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {icon}
        <h1 className="text-2xl font-bold text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white text-sm hidden sm:inline">
          Back
        </button>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="sm:hidden text-white hover:bg-white/10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-gray-900/98 border-white/10 p-0">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">MagicLens</h2>
              <p className="text-xs text-gray-400 mt-0.5">The AR Remix Layer</p>
            </div>
            <nav className="p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <SheetClose asChild key={item.href}>
                    <button
                      onClick={() => router.push(item.href)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left',
                        isActive
                          ? 'bg-yellow-400/10 text-yellow-400 font-medium'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  </SheetClose>
                )
              })}
            </nav>
            <div className="p-3 border-t border-white/10">
              <SheetClose asChild>
                <button
                  onClick={() => router.back()}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
