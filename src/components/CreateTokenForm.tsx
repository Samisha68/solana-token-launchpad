'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWallet } from '@solana/wallet-adapter-react'
import { Keypair } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTokenStore } from '@/store/useTokenStore'
import { solanaService } from '@/services/solana'
import { parseTokenAmount } from '@/lib/utils'
import { Loader2, Upload } from 'lucide-react'

const tokenSchema = z.object({
  name: z.string().min(1, 'Token name is required').max(32, 'Name too long'),
  symbol: z.string().min(1, 'Symbol is required').max(10, 'Symbol too long'),
  decimals: z.coerce.number().min(0).max(9),
  supply: z.string().min(1, 'Supply is required'),
  description: z.string().optional(),
  image: z.string().optional(),
})

type TokenFormData = {
  name: string
  symbol: string
  decimals: number
  supply: string
  description?: string
  image?: string
}

export const CreateTokenForm: React.FC = () => {
  const { publicKey, connected } = useWallet()
  const { addToken } = useTokenStore()
  const [isCreating, setIsCreating] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TokenFormData>({
    resolver: zodResolver(tokenSchema),
    defaultValues: {
      name: '',
      symbol: '',
      decimals: 6,
      supply: '',
      description: '',
      image: '',
    },
  })

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      // In a real app, you'd upload to IPFS or another storage service
      // For now, we'll just create a local URL
      // const imageUrl = URL.createObjectURL(file)
      // You could set this in the form or handle it separately
    }
  }

  const onSubmit = async (data: TokenFormData) => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first')
      return
    }

    setIsCreating(true)
    try {
      // Create a keypair for the mint authority (in production, you might want to use a different approach)
      const mintAuthority = Keypair.generate()
      
      // Create the token mint
      const mintAddress = await solanaService.createToken(
        mintAuthority, // This should be the payer keypair, but we're simulating
        publicKey, // mint authority
        null, // freeze authority
        data.decimals
      )

      // Mint the initial supply
      const totalSupply = parseTokenAmount(data.supply, data.decimals)
      await solanaService.mintTokens(
        mintAuthority, // payer
        mintAddress,
        publicKey, // destination
        mintAuthority, // authority
        totalSupply
      )

      // Add token to store
      const newToken = {
        mint: mintAddress,
        name: data.name,
        symbol: data.symbol,
        decimals: data.decimals,
        supply: totalSupply,
        description: data.description,
        image: imageFile ? URL.createObjectURL(imageFile) : undefined,
        creator: publicKey,
        createdAt: new Date(),
      }

      addToken(newToken)
      reset()
      setImageFile(null)
      alert('Token created successfully!')
    } catch (error) {
      console.error('Failed to create token:', error)
      alert('Failed to create token. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Token</CardTitle>
          <CardDescription>
            Please connect your wallet to create a new token.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Token</CardTitle>
        <CardDescription>
          Create a new SPL token on Solana with custom parameters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Token Name *
              </label>
              <Input
                id="name"
                placeholder="My Awesome Token"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="symbol" className="text-sm font-medium">
                Symbol *
              </label>
              <Input
                id="symbol"
                placeholder="MAT"
                {...register('symbol')}
              />
              {errors.symbol && (
                <p className="text-sm text-destructive">{errors.symbol.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="decimals" className="text-sm font-medium">
                Decimals
              </label>
              <Input
                id="decimals"
                type="number"
                min="0"
                max="9"
                {...register('decimals', { valueAsNumber: true })}
              />
              {errors.decimals && (
                <p className="text-sm text-destructive">{errors.decimals.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="supply" className="text-sm font-medium">
                Initial Supply *
              </label>
              <Input
                id="supply"
                placeholder="1000000"
                {...register('supply')}
              />
              {errors.supply && (
                <p className="text-sm text-destructive">{errors.supply.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe your token..."
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="image" className="text-sm font-medium">
              Token Image
            </label>
            <div className="flex items-center gap-4">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image')?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Image
              </Button>
              {imageFile && (
                <span className="text-sm text-muted-foreground">
                  {imageFile.name}
                </span>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Token...
              </>
            ) : (
              'Create Token'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 