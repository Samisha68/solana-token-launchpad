'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletButton } from './WalletButton'
import { cn } from '@/lib/utils'
import { Coins, ShoppingCart, Gift, Plus, Shield } from 'lucide-react'

const navItems = [
  {
    href: '/',
    label: 'Dashboard',
    icon: Coins,
  },
  {
    href: '/create-token',
    label: 'Create Token',
    icon: Plus,
  },
  {
    href: '/token-sales',
    label: 'Token Sales',
    icon: ShoppingCart,
  },
  {
    href: '/verify',
    label: 'Verify Identity',
    icon: Shield,
  },
  {
    href: '/distributions',
    label: 'Free Distributions',
    icon: Gift,
  },
]

export const Navigation: React.FC = () => {
  const pathname = usePathname()

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Coins className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">SolToken</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-500 text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
          
          <WalletButton />
        </div>
      </div>
    </nav>
  )
} 