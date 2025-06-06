'use client'

import React, { useEffect, useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import dynamic from 'next/dynamic'
import { useWalletStore } from '@/store/useWalletStore'
import { solanaService } from '@/services/solana'
import { shortenAddress } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut, RefreshCw, AlertCircle } from 'lucide-react'

// Dynamically import WalletMultiButton to avoid SSR issues
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => ({ default: mod.WalletMultiButton })),
  { 
    ssr: false,
    loading: () => <Button disabled>Loading...</Button>
  }
)

export const WalletButton: React.FC = () => {
  const { publicKey, connected, disconnect } = useWallet()
  const { connection } = useConnection()
  const { setWallet, setConnection, setBalance, disconnect: storeDisconnect } = useWalletStore()
  const [mounted, setMounted] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setWallet(publicKey, connected)
    setConnection(connection)
  }, [publicKey, connected, connection, setWallet, setConnection])

  useEffect(() => {
    const updateBalance = async () => {
      if (publicKey && connected) {
        try {
          setBalanceError(null)
          const balance = await solanaService.getBalance(publicKey)
          setBalance(balance)
        } catch (error: unknown) {
          console.error('Failed to fetch balance:', error)
          setBalanceError(error instanceof Error ? error.message : 'Failed to fetch balance')
        }
      }
    }

    updateBalance()
    const interval = setInterval(updateBalance, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [publicKey, connected, setBalance])

  const handleDisconnect = () => {
    disconnect()
    storeDisconnect()
  }

  const handleRefreshBalance = async () => {
    if (publicKey && connected) {
      setIsRefreshing(true)
      setBalanceError(null)
      try {
        const balance = await solanaService.getBalance(publicKey)
        setBalance(balance)
      } catch (error: unknown) {
        console.error('Failed to refresh balance:', error)
        setBalanceError(error instanceof Error ? error.message : 'Failed to refresh balance')
      } finally {
        setIsRefreshing(false)
      }
    }
  }

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return <Button disabled>Loading...</Button>
  }

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-md">
          <Wallet className="h-4 w-4" />
          <div className="text-sm">
            <div className="font-medium">
              {shortenAddress(publicKey.toString())}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              {balanceError ? (
                <>
                  <AlertCircle className="h-3 w-3 text-destructive" />
                  <span className="text-destructive">Balance Error</span>
                </>
              ) : (
                `${useWalletStore.getState().balance.toFixed(4)} SOL`
              )}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshBalance}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </Button>
        {balanceError && (
          <div className="text-xs text-destructive max-w-xs">
            {balanceError}
          </div>
        )}
      </div>
    )
  }

  return (
    <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !rounded-md !h-10 !px-4 !py-2 !text-sm !font-medium" />
  )
} 