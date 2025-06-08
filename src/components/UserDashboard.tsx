'use client'


import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  Star, 
  Gift, 
  TrendingUp, 
  Users, 
  Zap, 
  Award,
  Target,
  Eye,
  Lock,
  Plus
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

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

interface Project {
  _id: string
  companyName: string
  tokenName: string
  tokenSymbol: string
  description: string
  logo?: string
  raiseGoal: number
  raisedAmount: number
  tokenPrice: number
  category: string
  status: string
  featured: boolean
  team: Array<{ name: string; role: string }>
  tags: string[]
  minInvestment: number
  whitelistOnly: boolean
  endDate?: string
}

interface UserDashboardProps {
  user: User
}

const QuickActionCard = ({ 
  title, 
  description, 
  icon: Icon, 
  action, 
  variant = 'default',
  disabled = false,
  href
}: {
  title: string
  description: string
  icon: React.ElementType
  action: string
  variant?: 'default' | 'premium' | 'locked'
  disabled?: boolean
  href?: string
}) => {
  const baseClasses = "relative p-6 rounded-xl border-2 transition-all hover:shadow-lg"
  const variantClasses = {
    default: "border-gray-200 bg-white hover:border-blue-300",
    premium: "border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 hover:border-blue-400",
    locked: "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
  }

  const content = (
    <div className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'pointer-events-none' : ''}`}>
      {variant === 'premium' && (
        <div className="absolute -top-2 -right-2">
          <Star className="w-6 h-6 text-yellow-500 fill-current" />
        </div>
      )}
      {variant === 'locked' && (
        <div className="absolute -top-2 -right-2">
          <Lock className="w-6 h-6 text-gray-400" />
        </div>
      )}
      
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          variant === 'premium' ? 'bg-blue-500' :
          variant === 'locked' ? 'bg-gray-400' :
          'bg-gray-600'
        }`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          
          <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            variant === 'premium' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
            variant === 'locked' ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :
            'bg-gray-600 hover:bg-gray-700 text-white'
          }`}>
            {action}
          </button>
        </div>
      </div>
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

export default function UserDashboard({ user }: UserDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'available' | 'premium'>('all')

  // Fetch projects based on user type
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const params = new URLSearchParams()
        
        // Show different projects based on user type
        if (user.userType === 'existing') {
          params.append('featured', 'true')
        }
        if (user.userType === 'new') {
          params.append('status', 'active')
        }
        params.append('limit', '6')

        const response = await fetch(`/api/projects?${params}`)
        const data = await response.json()
        
        if (data.success) {
          setProjects(data.projects)
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [user.userType])

  // Filter projects based on user access level
  const getAccessibleProjects = () => {
    return projects.filter(project => {
      if (filter === 'premium') {
        return project.whitelistOnly && user.userType === 'existing'
      }
      if (filter === 'available') {
        return !project.whitelistOnly || user.userType === 'existing'
      }
      return true
    })
  }

  // Get personalized quick actions based on user type
  const getQuickActions = () => {
    const actions = []

    if (user.userType === 'new') {
      actions.push({
        title: 'Prove Your Loyalty',
        description: 'Connect your social accounts to verify past engagement',
        icon: Shield,
        action: 'Start Verification',
        variant: 'premium' as const,
        href: '/verify'
      })
      actions.push({
        title: 'Browse Projects',
        description: 'Discover available investment opportunities',
        icon: TrendingUp,
        action: 'View Projects',
        href: '/projects'
      })
      actions.push({
        title: 'Learn About DAO',
        description: 'Understand governance and voting mechanisms',
        icon: Users,
        action: 'Learn More',
        href: '/learn'
      })
      // Show locked premium features
      actions.push({
        title: 'Premium Projects',
        description: 'Unlock by proving your loyalty',
        icon: Lock,
        action: 'Locked',
        variant: 'locked' as const,
        disabled: true
      })
      actions.push({
        title: 'Create Projects',
        description: 'Available for Loyal Members only',
        icon: Lock,
        action: 'Locked',
        variant: 'locked' as const,
        disabled: true
      })
    }

    if (user.userType === 'existing') {
      actions.push({
        title: 'Premium Projects',
        description: 'Access exclusive early-stage investment rounds',
        icon: Award,
        action: 'View Premium',
        variant: 'premium' as const,
        href: '/projects?premium=true'
      })
      actions.push({
        title: 'Create Project',
        description: 'Launch your own token and raise funds',
        icon: Plus,
        action: 'Create Project',
        variant: 'premium' as const,
        href: '/create-project'
      })
      actions.push({
        title: 'Governance Hub',
        description: 'Lead community decisions with 3x voting power',
        icon: Users,
        action: 'Enter Hub',
        href: '/governance'
      })
      actions.push({
        title: 'Claim Rewards',
        description: 'Access exclusive airdrops and bonuses',
        icon: Gift,
        action: 'View Rewards',
        variant: 'premium' as const,
        href: '/rewards'
      })
    }

    return actions
  }

  const accessibleProjects = getAccessibleProjects()
  const quickActions = getQuickActions()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* User Status Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.userType === 'existing' ? 'Loyal Member Dashboard' : 'New Explorer Dashboard'}
                </h1>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user.userType === 'existing' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.userType === 'existing' ? '✨ Loyal' : '👋 New'}
                </div>
              </div>
              <p className="text-gray-600">
                {user.userType === 'existing' 
                  ? 'You have full access to premium features and exclusive opportunities.' 
                  : 'Prove your loyalty to unlock premium features and higher rewards.'}
              </p>
            </div>
            
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <div className="text-center">
                <div className="flex items-center text-sm text-gray-600">
                  <Zap className="w-4 h-4 mr-1 text-yellow-500" />
                  Credits
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {user.rewards.totalCredits}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-1 text-blue-500" />
                  Voting Power
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {user.votingPower}x
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="w-4 h-4 mr-1 text-green-500" />
                  Attestations
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {user.attestationCount || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {user.userType === 'new' ? 'Get Started & Prove Your Loyalty' : 'Your Premium Actions'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} {...action} />
            ))}
          </div>
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user.userType === 'existing' ? 'Premium & Featured Projects' : 'Available Projects'}
              </h2>
              <p className="text-gray-600 mt-1">
                {user.userType === 'existing' 
                  ? 'Exclusive early access and featured opportunities for loyal members' 
                  : 'Public projects you can invest in'}
              </p>
            </div>
            
            <div className="flex gap-2 mt-4 md:mt-0">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('available')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'available' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Available to You
              </button>
              {user.userType === 'existing' && (
                <button
                  onClick={() => setFilter('premium')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'premium' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Star className="w-4 h-4 mr-1 inline" />
                  Premium
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-2 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : accessibleProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accessibleProjects.map((project) => (
                <div key={project._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Access Badge */}
                  {project.whitelistOnly && (
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 text-xs font-medium">
                      <Star className="w-3 h-3 inline mr-1" />
                      Loyal Members Only
                    </div>
                  )}
                  
                  {/* Project Logo */}
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
                    {project.logo ? (
                      <Image
                        src={project.logo}
                        alt={project.companyName}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {project.tokenSymbol}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{project.companyName}</h3>
                        <p className="text-sm text-gray-600">{project.tokenSymbol}</p>
                      </div>
                      {project.featured && (
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">
                          {((project.raisedAmount / project.raiseGoal) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((project.raisedAmount / project.raiseGoal) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Access Status */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600">Min. Investment</span>
                      <span className="text-sm font-medium">${project.minInvestment}</span>
                    </div>

                    {/* Action Button */}
                    {project.whitelistOnly && user.userType === 'new' ? (
                      <button className="w-full bg-gray-200 text-gray-500 py-2 rounded-lg font-medium cursor-not-allowed">
                        <Lock className="w-4 h-4 inline mr-2" />
                        Loyalty Verification Required
                      </button>
                    ) : (
                      <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors">
                        <Eye className="w-4 h-4 inline mr-2" />
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Available</h3>
              <p className="text-gray-600">
                {user.userType === 'new' 
                  ? 'Prove your loyalty to unlock more investment opportunities.'
                  : 'Check back soon for new premium projects.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Progression Hint for New Users */}
        {user.userType === 'new' && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <Target className="w-8 h-8 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Prove Your Loyalty & Unlock Premium Features
                </h3>
                <p className="text-gray-600 mb-4">
                  Connect your GitHub, Twitter, Discord, or other accounts to prove your past engagement and loyalty. 
                  Unlock premium project access, 3x voting power, project creation privileges, and exclusive rewards.
                </p>
                <Link href="/verify">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    Start Loyalty Verification
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 