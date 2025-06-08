'use client'

import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Shield, Star, Gift, TrendingUp, ChevronRight, Check, Users, Zap } from 'lucide-react'

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

interface UserOnboardingProps {
  user: User | null
  onUserUpdate: (user: User) => void
}

const UserTypeCard = ({ 
  title, 
  description, 
  benefits, 
  icon: Icon, 
  isActive, 
  isUnlocked,
  action 
}: {
  title: string
  description: string
  benefits: string[]
  icon: React.ElementType
  isActive: boolean
  isUnlocked: boolean
  action?: string
}) => (
  <div className={`relative border-2 rounded-xl p-6 transition-all ${
    isActive 
      ? 'border-blue-500 bg-blue-50' 
      : isUnlocked 
        ? 'border-green-200 bg-green-50' 
        : 'border-gray-200 bg-gray-50'
  }`}>
    {/* Status Badge */}
    <div className="absolute -top-3 -right-3">
      {isActive && (
        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      )}
      {isUnlocked && !isActive && (
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </div>

    <div className="flex items-start space-x-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
        isActive ? 'bg-blue-500' : isUnlocked ? 'bg-green-500' : 'bg-gray-400'
      }`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        
        <div className="space-y-2">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center text-sm">
              <Check className={`w-4 h-4 mr-2 ${
                isUnlocked ? 'text-green-500' : 'text-gray-400'
              }`} />
              <span className={isUnlocked ? 'text-gray-700' : 'text-gray-500'}>
                {benefit}
              </span>
            </div>
          ))}
        </div>

        {action && (
          <button className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive 
              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}>
            {action}
          </button>
        )}
      </div>
    </div>
  </div>
)

export default function UserOnboarding({ user, onUserUpdate }: UserOnboardingProps) {
  const { connected, publicKey } = useWallet()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const userTypes = [
    {
      type: 'new',
      title: 'New Explorer',
      description: 'Welcome! Start your journey in decentralized innovation.',
      benefits: [
        'Browse and discover projects',
        'Basic investment access',
        'Community participation',
        'Standard voting power in DAO',
      ],
      icon: Users,
      action: 'Prove Your Loyalty',
    },
    {
      type: 'existing',
      title: 'Loyal Member',
      description: 'Verified loyalty with proven past engagement and activity.',
      benefits: [
        'Early access to all projects',
        '3x voting power in DAO decisions',
        'Exclusive premium project access',
        'Priority allocation in distributions',
        'Bonus rewards and airdrops',
        'Project creation privileges',
      ],
      icon: Shield,
      action: 'Maintain Loyalty Status',
    },
  ]

  const onboardingSteps = [
    {
      title: 'Welcome to the Future',
      description: 'Discover revolutionary projects and shape the future of innovation.',
      action: 'Get Started',
    },
    {
      title: 'Verify Your Identity',
      description: 'Connect your GitHub, Twitter, or other accounts to unlock rewards.',
      action: 'Start Verification',
    },
    {
      title: 'Explore Projects',
      description: 'Browse cutting-edge projects and invest in the ones you believe in.',
      action: 'Browse Projects',
    },
  ]

  // Auto-detect user auth when wallet connects
  useEffect(() => {
    const handleUserAuth = async () => {
      if (!connected || !publicKey) return
      
      setLoading(true)
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: publicKey.toString() }),
        })
        
        const data = await response.json()
        if (data.success) {
          onUserUpdate(data.user)
        }
      } catch (error) {
        console.error('Auto-auth failed:', error)
      } finally {
        setLoading(false)
      }
    }

    if (connected && publicKey && !user) {
      handleUserAuth()
    }
  }, [connected, publicKey, user, onUserUpdate])

  // Show onboarding flow for new users
  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="max-w-4xl w-full">
            {/* Current Step Indicator */}
            <div className="flex justify-center mb-8">
              <div className="flex space-x-2">
                {onboardingSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index <= currentStep ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="text-center text-white mb-12">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                {onboardingSteps[currentStep].title}
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
                {onboardingSteps[currentStep].description}
              </p>
              
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setCurrentStep(Math.min(currentStep + 1, onboardingSteps.length - 1))}
                  className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center"
                >
                  {onboardingSteps[currentStep].action}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <TrendingUp className="h-8 w-8 text-white mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Smart Investing</h3>
                <p className="text-blue-100 text-sm">
                  DAO-governed fund releases ensure your investments are protected by community oversight.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <Shield className="h-8 w-8 text-white mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Verified Access</h3>
                <p className="text-blue-100 text-sm">
                  Prove your identity and activity to unlock exclusive projects and higher rewards.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <Gift className="h-8 w-8 text-white mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Loyalty Rewards</h3>
                <p className="text-blue-100 text-sm">
                  Earn credits and tokens through attestations, governance participation, and community engagement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state during authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your profile...</p>
        </div>
      </div>
    )
  }

  // Show user type explanation and verification path
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Welcome Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome back! 👋
            </h1>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                user.userType === 'existing' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {user.userType === 'existing' ? '✨ Loyal Member' :
                 '👋 New Explorer'}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Zap className="w-4 h-4 mr-1 text-yellow-500" />
                {user.rewards.totalCredits} credits
              </div>
            </div>
            <p className="text-lg text-gray-600">
              {user.userType === 'new' ? 
                'Complete verifications to unlock exclusive features and earn rewards.' :
                'Your verified status gives you access to exclusive opportunities.'
              }
            </p>
          </div>

          {/* User Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
            {userTypes.map((typeInfo) => (
              <UserTypeCard
                key={typeInfo.type}
                title={typeInfo.title}
                description={typeInfo.description}
                benefits={typeInfo.benefits}
                icon={typeInfo.icon}
                isActive={user.userType === typeInfo.type}
                isUnlocked={
                  (typeInfo.type === 'new') ||
                  (typeInfo.type === 'existing' && user.userType === 'existing')
                }
                action={user.userType === typeInfo.type ? typeInfo.action : undefined}
              />
            ))}
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {user.userType === 'new' ? 'Get Started' :
               user.userType === 'existing' ? 'Level Up' :
               'Maintain Your Status'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {user.userType === 'new' && (
                  <>
                    <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                      <Shield className="w-6 h-6 text-blue-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Verify Your Identity</h3>
                        <p className="text-sm text-gray-600">Connect GitHub, Twitter, or email</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                    </div>
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-gray-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Explore Projects</h3>
                        <p className="text-sm text-gray-600">Browse available investment opportunities</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                    </div>
                  </>
                )}
                
                {user.userType === 'existing' && (
                  <>
                    <div className="flex items-center p-4 bg-green-50 rounded-lg">
                      <Gift className="w-6 h-6 text-green-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Claim Your Rewards</h3>
                        <p className="text-sm text-gray-600">Access premium airdrops and bonuses</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                    </div>
                    <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                      <Star className="w-6 h-6 text-purple-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Create Projects</h3>
                        <p className="text-sm text-gray-600">Launch your own token and raise funds</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                    </div>
                  </>
                )}
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Your Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Credits</span>
                    <span className="font-medium">{user.rewards.totalCredits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Voting Power</span>
                    <span className="font-medium">{user.votingPower}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Attestations</span>
                    <span className="font-medium">{user.attestationCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
} 