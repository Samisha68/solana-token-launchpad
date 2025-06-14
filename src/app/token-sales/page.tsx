'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CreateTokenSaleForm } from '@/components/CreateTokenSaleForm'
import { useTokenStore } from '@/store/useTokenStore'
import { getTokenSaleService, TokenSaleData } from '@/services/tokenSaleProgram'
import { formatDate } from '@/lib/utils'
import { ShoppingCart, Plus, Shield, TrendingUp, Loader2, AlertTriangle } from 'lucide-react'
import { PublicKey } from '@solana/web3.js'
import { getAttestationService } from '@/services/attestationService'

interface OnChainSale {
  account: PublicKey;
  data: TokenSaleData;
}

interface VerificationStatus {
  eligible: boolean;
  reasons: string[];
  kycStatus?: unknown;
  complianceStatus?: unknown;
}

export default function TokenSalesPage() {
  const { connected } = useWallet()
  const { connection } = useConnection()
  const wallet = useWallet()
  const { tokens } = useTokenStore()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [purchaseAmount, setPurchaseAmount] = useState<{ [saleId: string]: string }>({})
  const [onChainSales, setOnChainSales] = useState<OnChainSale[]>([])
  const [loading, setLoading] = useState(false)
  const [purchasing, setPurchasing] = useState<{ [saleId: string]: boolean }>({})
  const [verificationStatus, setVerificationStatus] = useState<{ [saleId: string]: VerificationStatus }>({})

  const checkVerificationStatus = useCallback(async () => {
    if (!connected || !wallet.publicKey) return
    
    try {
      const attestationService = getAttestationService(connection)
      const eligibility = await attestationService.checkTokenSaleEligibility(
        wallet.publicKey,
        {
          requireKYC: true,
          requireCompliance: true,
          minKYCLevel: 'enhanced',
          allowedJurisdictions: ['US', 'EU', 'UK'],
          requireAccreditedInvestor: true,
        }
      )
      
      // Set verification status for all sales
      const statusMap: { [saleId: string]: VerificationStatus } = {}
      onChainSales.forEach(sale => {
        statusMap[sale.account.toString()] = eligibility
      })
      setVerificationStatus(statusMap)
    } catch (error) {
      console.error('Failed to check verification status:', error)
    }
  }, [connected, wallet.publicKey, connection, onChainSales])

  const fetchOnChainSales = useCallback(async () => {
    if (!connected) return
    
    setLoading(true)
    try {
      const tokenSaleService = getTokenSaleService(connection)
      await tokenSaleService.initializeProgram(wallet as { publicKey: PublicKey | null; signTransaction: any; signAllTransactions: any })
      const sales = await tokenSaleService.getAllSales()
      setOnChainSales(sales)
    } catch (error) {
      console.error('Failed to fetch on-chain sales:', error)
    } finally {
      setLoading(false)
    }
  }, [connected, connection, wallet])

  // Fetch on-chain sales data
  useEffect(() => {
    if (connected) {
      fetchOnChainSales()
    }
  }, [connected, fetchOnChainSales])

  useEffect(() => {
    if (connected && onChainSales.length > 0) {
      checkVerificationStatus()
    }
  }, [connected, onChainSales.length, checkVerificationStatus])

  const handlePurchase = async (saleAccount: PublicKey, tokenMint: PublicKey) => {
    const saleId = saleAccount.toString()
    const amount = purchaseAmount[saleId]
    if (!amount || !connected) return
    
    setPurchasing(prev => ({ ...prev, [saleId]: true }))
    try {
      const tokenSaleService = getTokenSaleService(connection)
      
      // Create token account if needed
      await tokenSaleService.createTokenAccountIfNeeded(
        wallet as { publicKey: PublicKey | null; signTransaction: any; signAllTransactions: any },
        tokenMint,
        wallet.publicKey!
      )
      
      const signature = await tokenSaleService.buyTokens(
        wallet as { publicKey: PublicKey | null; signTransaction: any; signAllTransactions: any },
        saleAccount,
        tokenMint,
        parseInt(amount)
      )
      
      alert(`Purchase successful! Transaction: ${signature}`)
      
      // Refresh sales data
      await fetchOnChainSales()
      
      // Clear purchase amount
      setPurchaseAmount(prev => ({ ...prev, [saleId]: '' }))
    } catch (error) {
      console.error('Purchase failed:', error)
      alert(`Purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setPurchasing(prev => ({ ...prev, [saleId]: false }))
    }
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

  const activeSales = onChainSales.filter(sale => {
    const now = Date.now() / 1000
    return sale.data.startTime.toNumber() <= now && sale.data.endTime.toNumber() >= now
  })

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
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchOnChainSales} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Sale
          </Button>
        </div>
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
              ${activeSales.reduce((sum, sale) => 
                sum + (sale.data.totalSold.toNumber() * sale.data.pricePerToken.toNumber() / 1_000_000), 0
              ).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">USDC traded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onChainSales.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Loading Sales...</h3>
              <p className="text-muted-foreground text-center">
                Fetching token sales from the blockchain
              </p>
            </CardContent>
          </Card>
        ) : onChainSales.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Sales Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                There are currently no token sales. Create the first one!
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                Create Token Sale
              </Button>
            </CardContent>
          </Card>
        ) : (
          onChainSales.map((sale) => {
            const saleId = sale.account.toString()
            const token = tokens.find(t => t.mint.equals(sale.data.tokenMint))
            const progress = (sale.data.totalSold.toNumber() / sale.data.hardCap.toNumber()) * 100
            const startTime = new Date(sale.data.startTime.toNumber() * 1000)
            const endTime = new Date(sale.data.endTime.toNumber() * 1000)
            const now = Date.now()
            const isActive = startTime.getTime() <= now && endTime.getTime() >= now
            const isEnded = endTime.getTime() <= now
            const priceInUsdc = sale.data.pricePerToken.toNumber() / 1_000_000
            
            return (
              <Card key={saleId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {token?.name || 'Unknown Token'}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          isActive ? 'bg-green-100 text-green-800' : 
                          isEnded ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {isActive ? 'Active' : isEnded ? 'Ended' : 'Upcoming'}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {token?.symbol} • ${priceInUsdc.toFixed(6)} per token
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{progress.toFixed(1)}% sold</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.data.totalSold.toNumber().toLocaleString()} / {sale.data.hardCap.toNumber().toLocaleString()}
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
                      <p className="font-medium">{formatDate(startTime)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End Time</p>
                      <p className="font-medium">{formatDate(endTime)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Authority</p>
                      <p className="font-medium text-xs">{sale.data.authority.toString().slice(0, 8)}...</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sale Account</p>
                      <p className="font-medium text-xs">{saleId.slice(0, 8)}...</p>
                    </div>
                  </div>

                  {/* Verification Status */}
                  {verificationStatus[saleId] && (
                    <div className={`p-3 rounded-lg border ${
                      verificationStatus[saleId].eligible 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {verificationStatus[saleId].eligible ? (
                          <Shield className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          verificationStatus[saleId].eligible ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {verificationStatus[saleId].eligible ? 'Verification Passed' : 'Verification Required'}
                        </span>
                      </div>
                      {!verificationStatus[saleId].eligible && verificationStatus[saleId].reasons && (
                        <ul className="text-xs text-red-700 space-y-1">
                          {verificationStatus[saleId].reasons.map((reason: string, idx: number) => (
                            <li key={idx}>• {reason}</li>
                          ))}
                        </ul>
                      )}
                      {!verificationStatus[saleId].eligible && (
                        <div className="mt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.open('/verify', '_blank')}
                            className="text-xs"
                          >
                            Complete Verification
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Purchase Section */}
                  {isActive && (
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-sm font-medium">Amount to Purchase</label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={purchaseAmount[saleId] || ''}
                          onChange={(e) => setPurchaseAmount(prev => ({ 
                            ...prev, 
                            [saleId]: e.target.value 
                          }))}
                        />
                      </div>
                      <Button 
                        onClick={() => handlePurchase(sale.account, sale.data.tokenMint)}
                        disabled={
                          !purchaseAmount[saleId] || 
                          purchasing[saleId] || 
                          (verificationStatus[saleId] && !verificationStatus[saleId].eligible)
                        }
                      >
                        {purchasing[saleId] ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Buying...
                          </>
                        ) : verificationStatus[saleId] && !verificationStatus[saleId].eligible ? (
                          'Verification Required'
                        ) : (
                          'Buy Tokens'
                        )}
                      </Button>
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