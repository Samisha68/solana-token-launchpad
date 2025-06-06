'use client'

import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CreateTokenSaleForm } from '@/components/CreateTokenSaleForm'
import { useTokenStore } from '@/store/useTokenStore'
import { formatDate } from '@/lib/utils'
import { ShoppingCart, Plus, Clock, Shield, TrendingUp } from 'lucide-react'

export default function TokenSalesPage() {
  const { connected } = useWallet()
  const { tokens, sales } = useTokenStore()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [purchaseAmount, setPurchaseAmount] = useState<{ [saleId: string]: string }>({})

  const activeSales = sales.filter(sale => sale.isActive)

  const handlePurchase = async (saleId: string) => {
    const amount = purchaseAmount[saleId]
    if (!amount) return
    
    // In a real implementation, this would interact with the Solana program
    alert(`Purchase functionality would be implemented here for ${amount} tokens`)
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Token Sales</h1>
          <p className="text-muted-foreground">Connect your wallet to view and participate in token sales</p>
        </div>
      </div>
    )
  }

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Create Token Sale</h1>
          <Button variant="outline" onClick={() => setShowCreateForm(false)}>
            Back to Sales
          </Button>
        </div>
        <div className="max-w-2xl mx-auto">
          <CreateTokenSaleForm />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Token Sales</h1>
          <p className="text-muted-foreground">
            Discover and participate in token sales with verification requirements
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Sale
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSales.length}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${activeSales.reduce((sum, sale) => sum + (sale.soldTokens * sale.pricePerToken), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">USDC traded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Sales</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeSales.filter(sale => sale.requiresVerification).length}
            </div>
            <p className="text-xs text-muted-foreground">Require verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales List */}
      <div className="space-y-4">
        {activeSales.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Sales</h3>
              <p className="text-muted-foreground text-center mb-4">
                There are currently no active token sales. Create the first one!
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                Create Token Sale
              </Button>
            </CardContent>
          </Card>
        ) : (
          activeSales.map((sale) => {
            const token = tokens.find(t => t.mint.equals(sale.tokenMint))
            const progress = (sale.soldTokens / sale.totalTokens) * 100
            const timeLeft = sale.endTime.getTime() - Date.now()
            const isEnded = timeLeft <= 0
            
            return (
              <Card key={sale.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {token?.name || 'Unknown Token'}
                        {sale.requiresVerification && (
                          <Shield className="h-4 w-4 text-blue-500" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        {token?.symbol} • ${sale.pricePerToken} per token
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{progress.toFixed(1)}% sold</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.soldTokens.toLocaleString()} / {sale.totalTokens.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all" 
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Sale Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Start Time</p>
                      <p className="font-medium">{formatDate(sale.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End Time</p>
                      <p className="font-medium">{formatDate(sale.endTime)}</p>
                    </div>
                    {sale.minPurchase && (
                      <div>
                        <p className="text-muted-foreground">Min Purchase</p>
                        <p className="font-medium">{sale.minPurchase} tokens</p>
                      </div>
                    )}
                    {sale.maxPurchase && (
                      <div>
                        <p className="text-muted-foreground">Max Purchase</p>
                        <p className="font-medium">{sale.maxPurchase} tokens</p>
                      </div>
                    )}
                  </div>

                  {/* Verification Requirements */}
                  {sale.requiresVerification && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Verification Required
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        This sale requires {sale.verificationMethod === 'reclaim' ? 'Reclaim Protocol' : 'Solana Attestation'} verification
                      </p>
                    </div>
                  )}

                  {/* Vesting Information */}
                  {sale.vestingPeriod && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                          Vesting Period
                        </span>
                      </div>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        Tokens will be vested over {sale.vestingPeriod} days
                      </p>
                    </div>
                  )}

                  {/* Purchase Section */}
                  {!isEnded && progress < 100 && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Amount to purchase"
                        value={purchaseAmount[sale.id] || ''}
                        onChange={(e) => setPurchaseAmount(prev => ({
                          ...prev,
                          [sale.id]: e.target.value
                        }))}
                        min={sale.minPurchase || 1}
                        max={sale.maxPurchase || sale.totalTokens - sale.soldTokens}
                      />
                      <Button 
                        onClick={() => handlePurchase(sale.id)}
                        disabled={!purchaseAmount[sale.id] || parseFloat(purchaseAmount[sale.id]) <= 0}
                      >
                        Purchase
                      </Button>
                    </div>
                  )}

                  {isEnded && (
                    <div className="text-center py-2">
                      <p className="text-muted-foreground">This sale has ended</p>
                    </div>
                  )}

                  {progress >= 100 && (
                    <div className="text-center py-2">
                      <p className="text-green-600 font-medium">Sale completed!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
} 