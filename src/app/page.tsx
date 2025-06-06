'use client'

import React from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useTokenStore } from '@/store/useTokenStore'
import { useWalletStore } from '@/store/useWalletStore'
import { formatTokenAmount, formatDate } from '@/lib/utils'
import { Coins, ShoppingCart, Gift, Plus, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function Dashboard() {
  const { connected, publicKey } = useWallet()
  const { balance } = useWalletStore()
  const { tokens, sales, distributions } = useTokenStore()

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
            <Coins className="h-10 w-10 text-blue-600" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Welcome to SolToken
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Create, sell, and distribute tokens on Solana with built-in verification and custom rules.
            </p>
          </div>
          
          <div className="pt-4">
            <p className="text-gray-600 mb-6">Connect your wallet to get started</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="text-sm text-gray-600">
                No wallet connected. Use the &quot;Select Wallet&quot; button above to connect your Solana wallet.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const userTokens = tokens.filter(token => token.creator.equals(publicKey!))
  const userSales = sales.filter(sale => 
    userTokens.some(token => token.mint.equals(sale.tokenMint))
  )
  const activeSales = sales.filter(sale => sale.isActive)
  const activeDistributions = distributions.filter(dist => dist.isActive)

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-lg text-gray-600">
            Welcome back! Here&apos;s an overview of your token activities.
          </p>
        </div>
        <div className="flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Coins className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Wallet Balance</p>
                <p className="text-xl font-semibold text-gray-900">{balance.toFixed(4)} SOL</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-600">Your Tokens</p>
              <p className="text-3xl font-bold text-blue-900">{userTokens.length}</p>
              <p className="text-xs text-blue-600/70">Tokens created by you</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Coins className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-0 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-600">Active Sales</p>
              <p className="text-3xl font-bold text-green-900">{activeSales.length}</p>
              <p className="text-xs text-green-600/70">Currently running sales</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-purple-600">Distributions</p>
              <p className="text-3xl font-bold text-purple-900">{activeDistributions.length}</p>
              <p className="text-xs text-purple-600/70">Active free distributions</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Gift className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-orange-600">Your Sales</p>
              <p className="text-3xl font-bold text-orange-900">{userSales.length}</p>
              <p className="text-xs text-orange-600/70">Sales you&apos;ve created</p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-6 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-base text-gray-600 mt-1">
            Get started with creating tokens and setting up sales
          </p>
        </div>
        <div className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/create-token">
              <button className="w-full h-24 flex flex-col items-center justify-center space-y-3 bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors rounded-xl">
                <Plus className="h-6 w-6" />
                <span>Create Token</span>
              </button>
            </Link>
            <Link href="/token-sales">
              <button className="w-full h-24 flex flex-col items-center justify-center space-y-3 border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-colors rounded-xl">
                <ShoppingCart className="h-6 w-6" />
                <span>Create Sale</span>
              </button>
            </Link>
            <Link href="/distributions">
              <button className="w-full h-24 flex flex-col items-center justify-center space-y-3 border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-colors rounded-xl">
                <Gift className="h-6 w-6" />
                <span>Create Distribution</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Tokens */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900">Your Tokens</h3>
            <p className="text-gray-600 mt-1">Tokens you&apos;ve created</p>
          </div>
          <div className="p-6 pt-0">
            {userTokens.length === 0 ? (
              <div className="text-center py-8">
                <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tokens created yet</p>
                <Link href="/create-token">
                  <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Create Your First Token
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userTokens.slice(0, 3).map((token) => (
                  <div key={token.mint.toString()} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {token.image && (
                        <Image src={token.image} alt={token.name} width={40} height={40} className="h-10 w-10 rounded-full" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{token.name}</p>
                        <p className="text-sm text-gray-600">{token.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatTokenAmount(token.supply, token.decimals)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDate(token.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {userTokens.length > 3 && (
                  <p className="text-center text-sm text-gray-600">
                    And {userTokens.length - 3} more...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active Sales */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900">Active Sales</h3>
            <p className="text-gray-600 mt-1">Currently running token sales</p>
          </div>
          <div className="p-6 pt-0">
            {activeSales.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No active sales</p>
                <Link href="/token-sales">
                  <button className="mt-4 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
                    Browse Sales
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSales.slice(0, 3).map((sale) => {
                  const token = tokens.find(t => t.mint.equals(sale.tokenMint))
                  const progress = (sale.soldTokens / sale.totalTokens) * 100
                  
                  return (
                    <div key={sale.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{token?.name || 'Unknown Token'}</p>
                          <p className="text-sm text-gray-600">
                            ${sale.pricePerToken} per token
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{progress.toFixed(1)}% sold</p>
                          <p className="text-xs text-gray-600 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Ends {formatDate(sale.endTime)}
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                {activeSales.length > 3 && (
                  <p className="text-center text-sm text-gray-600">
                    And {activeSales.length - 3} more...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
