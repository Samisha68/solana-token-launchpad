'use client'

import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTokenStore } from '@/store/useTokenStore'
import { formatDate } from '@/lib/utils'
import { Gift, Plus, Shield, Users, CheckCircle } from 'lucide-react'

export default function DistributionsPage() {
  const { connected, publicKey } = useWallet()
  const { tokens, distributions } = useTokenStore()
  const [, setShowCreateForm] = useState(false)

  const activeDistributions = distributions.filter(dist => dist.isActive)

  const handleClaim = async (distributionId: string) => {
    alert(`Claim functionality would be implemented here for distribution ${distributionId}`)
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <Gift className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Free Token Distributions</h1>
          <p className="text-muted-foreground">Connect your wallet to view and claim free tokens</p>
        </div>
      </div>
    )
  }

  const userTokens = tokens.filter(token => token.creator.equals(publicKey!))

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Free Token Distributions</h1>
          <p className="text-muted-foreground">
            Claim free tokens by proving your eligibility through verification
          </p>
        </div>
        {userTokens.length > 0 && (
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Distribution
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Distributions</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDistributions.length}</div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distributed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeDistributions.reduce((sum, dist) => sum + dist.claimedTokens, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Tokens claimed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Claims</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">Require verification</p>
          </CardContent>
        </Card>
      </div>

      {activeDistributions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gift className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Distributions</h3>
            <p className="text-muted-foreground text-center mb-4">
              There are currently no active token distributions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeDistributions.map((distribution) => {
            const token = tokens.find(t => t.mint.equals(distribution.tokenMint))
            const progress = (distribution.claimedTokens / distribution.totalTokens) * 100
            
            return (
              <Card key={distribution.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {token?.name || 'Unknown Token'} Distribution
                        <Shield className="h-4 w-4 text-green-500" />
                      </CardTitle>
                      <CardDescription>
                        Free {token?.symbol} tokens with verification requirements
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{progress.toFixed(1)}% claimed</p>
                      <p className="text-xs text-muted-foreground">
                        {distribution.claimedTokens.toLocaleString()} / {distribution.totalTokens.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all" 
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Start Time</p>
                      <p className="font-medium">{formatDate(distribution.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Verification</p>
                      <p className="font-medium">
                        {distribution.verificationMethod === 'reclaim' ? 'Reclaim Protocol' : 'Solana Attestation'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Eligibility Requirements
                      </span>
                    </div>
                    <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
                      {distribution.eligibilityRules.map((rule, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    onClick={() => handleClaim(distribution.id)}
                    className="w-full"
                  >
                    Verify & Claim Tokens
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
} 