'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTokenStore } from '@/store/useTokenStore'
import { getTokenSaleService } from '@/services/tokenSaleProgram'
import { PublicKey } from '@solana/web3.js'
import { Loader2, Calendar, Shield } from 'lucide-react'

const saleSchema = z.object({
  tokenMint: z.string().min(1, 'Please select a token'),
  usdcMint: z.string().min(1, 'USDC mint address is required'),
  pricePerToken: z.coerce.number().min(0.001, 'Price must be greater than 0'),
  totalTokens: z.coerce.number().min(1, 'Must sell at least 1 token'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  vestingPeriod: z.coerce.number().optional(),
  minPurchase: z.coerce.number().optional(),
  maxPurchase: z.coerce.number().optional(),
  requiresVerification: z.boolean(),
  verificationMethod: z.enum(['reclaim', 'solana-attestation']).optional(),
})

type SaleFormData = {
  tokenMint: string
  usdcMint: string
  pricePerToken: number
  totalTokens: number
  startTime: string
  endTime: string
  vestingPeriod?: number
  minPurchase?: number
  maxPurchase?: number
  requiresVerification: boolean
  verificationMethod?: 'reclaim' | 'solana-attestation'
}

export const CreateTokenSaleForm: React.FC = () => {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const wallet = useWallet()
  const { tokens, addSale } = useTokenStore()
  const [isCreating, setIsCreating] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      tokenMint: '',
      usdcMint: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr', // USDC devnet mint
      pricePerToken: 0,
      totalTokens: 0,
      startTime: '',
      endTime: '',
      requiresVerification: false,
      verificationMethod: 'reclaim',
    },
  })

  const requiresVerification = watch('requiresVerification')

  const onSubmit = async (data: SaleFormData) => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first')
      return
    }

    setIsCreating(true)
    try {
      const selectedToken = tokens.find(t => t.mint.toString() === data.tokenMint)
      if (!selectedToken) {
        throw new Error('Selected token not found')
      }

      const tokenSaleService = getTokenSaleService(connection)
      
      // Convert dates to Unix timestamps
      const startTime = Math.floor(new Date(data.startTime).getTime() / 1000)
      const endTime = Math.floor(new Date(data.endTime).getTime() / 1000)
      
      // Create the token sale on-chain
      const { saleAccount, signature } = await tokenSaleService.createTokenSale(
        wallet,
        new PublicKey(data.tokenMint),
        new PublicKey(data.usdcMint),
        startTime,
        endTime,
        data.pricePerToken,
        data.totalTokens
      )

      // Add to local store for UI
      const newSale = {
        id: saleAccount.toString(),
        tokenMint: selectedToken.mint,
        pricePerToken: data.pricePerToken,
        totalTokens: data.totalTokens,
        soldTokens: 0,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        vestingPeriod: data.vestingPeriod,
        minPurchase: data.minPurchase,
        maxPurchase: data.maxPurchase,
        isActive: true,
        requiresVerification: data.requiresVerification,
        verificationMethod: data.verificationMethod,
      }

      addSale(newSale)
      reset()
      alert(`Token sale created successfully! Transaction: ${signature}`)
    } catch (error) {
      console.error('Failed to create token sale:', error)
      alert(`Failed to create token sale: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsCreating(false)
    }
  }

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Token Sale</CardTitle>
          <CardDescription>
            Please connect your wallet to create a token sale.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const userTokens = tokens.filter(token => token.creator.equals(publicKey!))

  if (userTokens.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Token Sale</CardTitle>
          <CardDescription>
            You need to create a token first before setting up a sale.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Token Sale</CardTitle>
        <CardDescription>
          Set up a token sale with custom rules and verification requirements.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="tokenMint" className="text-sm font-medium">
              Select Token *
            </label>
            <select
              id="tokenMint"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register('tokenMint')}
            >
              <option value="">Select a token...</option>
              {userTokens.map((token) => (
                <option key={token.mint.toString()} value={token.mint.toString()}>
                  {token.name} ({token.symbol})
                </option>
              ))}
            </select>
            {errors.tokenMint && (
              <p className="text-sm text-destructive">{errors.tokenMint.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="usdcMint" className="text-sm font-medium">
              USDC Mint Address *
            </label>
            <Input
              id="usdcMint"
              placeholder="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
              {...register('usdcMint')}
            />
            {errors.usdcMint && (
              <p className="text-sm text-destructive">{errors.usdcMint.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="pricePerToken" className="text-sm font-medium">
                Price per Token (USDC) *
              </label>
              <Input
                id="pricePerToken"
                type="number"
                step="0.001"
                placeholder="0.1"
                {...register('pricePerToken')}
              />
              {errors.pricePerToken && (
                <p className="text-sm text-destructive">{errors.pricePerToken.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="totalTokens" className="text-sm font-medium">
                Total Tokens for Sale *
              </label>
              <Input
                id="totalTokens"
                type="number"
                placeholder="10000"
                {...register('totalTokens')}
              />
              {errors.totalTokens && (
                <p className="text-sm text-destructive">{errors.totalTokens.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="startTime" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Time *
              </label>
              <Input
                id="startTime"
                type="datetime-local"
                {...register('startTime')}
              />
              {errors.startTime && (
                <p className="text-sm text-destructive">{errors.startTime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="endTime" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Time *
              </label>
              <Input
                id="endTime"
                type="datetime-local"
                {...register('endTime')}
              />
              {errors.endTime && (
                <p className="text-sm text-destructive">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="vestingPeriod" className="text-sm font-medium">
                Vesting Period (days)
              </label>
              <Input
                id="vestingPeriod"
                type="number"
                placeholder="30"
                {...register('vestingPeriod')}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="minPurchase" className="text-sm font-medium">
                Min Purchase (tokens)
              </label>
              <Input
                id="minPurchase"
                type="number"
                placeholder="1"
                {...register('minPurchase')}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="maxPurchase" className="text-sm font-medium">
                Max Purchase (tokens)
              </label>
              <Input
                id="maxPurchase"
                type="number"
                placeholder="1000"
                {...register('maxPurchase')}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                id="requiresVerification"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                {...register('requiresVerification')}
              />
              <label htmlFor="requiresVerification" className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Require Verification
              </label>
            </div>

            {requiresVerification && (
              <div className="space-y-2">
                <label htmlFor="verificationMethod" className="text-sm font-medium">
                  Verification Method
                </label>
                <select
                  id="verificationMethod"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  {...register('verificationMethod')}
                >
                  <option value="reclaim">Reclaim Protocol</option>
                  <option value="solana-attestation">Solana Attestation</option>
                </select>
              </div>
            )}
          </div>

          <Button type="submit" disabled={isCreating} className="w-full">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Sale...
              </>
            ) : (
              'Create Token Sale'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 