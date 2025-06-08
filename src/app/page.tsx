'use client'

import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import UserOnboarding from '@/components/UserOnboarding'
import UserDashboard from '@/components/UserDashboard'

interface User {
  id: string
  walletAddress: string
  userType: 'new' | 'existing'
  rewards: {
    totalCredits: number
    totalTokens: number
  }
  votingPower: number
  attestationCount?: number
}

export default function Dashboard() {
  const { connected } = useWallet()
  const [user, setUser] = useState<User | null>(null)

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser)
  }

  // Show onboarding for unconnected users or user dashboard for connected users
  if (!connected || !user) {
    return <UserOnboarding user={user} onUserUpdate={handleUserUpdate} />
  }

  // Show personalized dashboard based on user type
  return <UserDashboard user={user} />


} 