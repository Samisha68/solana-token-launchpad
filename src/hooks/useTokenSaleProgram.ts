import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useCallback, useEffect, useState } from 'react'
import { getTokenSaleService, TokenSaleData } from '@/services/tokenSaleProgram'
import { PublicKey } from '@solana/web3.js'

export interface OnChainSale {
  account: PublicKey;
  data: TokenSaleData;
}

export const useTokenSaleProgram = () => {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [sales, setSales] = useState<OnChainSale[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tokenSaleService = getTokenSaleService(connection)

  const fetchSales = useCallback(async () => {
    if (!wallet.connected) return

    setLoading(true)
    setError(null)
    try {
      await tokenSaleService.initializeProgram(wallet)
      const salesData = await tokenSaleService.getAllSales()
      setSales(salesData)
    } catch (err) {
      console.error('Failed to fetch sales:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch sales')
    } finally {
      setLoading(false)
    }
  }, [wallet.connected, tokenSaleService])

  const createSale = useCallback(async (
    tokenMint: PublicKey,
    usdcMint: PublicKey,
    startTime: number,
    endTime: number,
    pricePerToken: number,
    hardCap: number
  ) => {
    if (!wallet.connected) throw new Error('Wallet not connected')

    const result = await tokenSaleService.createTokenSale(
      wallet,
      tokenMint,
      usdcMint,
      startTime,
      endTime,
      pricePerToken,
      hardCap
    )

    // Refresh sales after creation
    await fetchSales()
    
    return result
  }, [wallet, tokenSaleService, fetchSales])

  const buyTokens = useCallback(async (
    saleAccount: PublicKey,
    tokenMint: PublicKey,
    amount: number
  ) => {
    if (!wallet.connected) throw new Error('Wallet not connected')

    // Create token account if needed
    await tokenSaleService.createTokenAccountIfNeeded(
      wallet,
      tokenMint,
      wallet.publicKey!
    )

    const signature = await tokenSaleService.buyTokens(
      wallet,
      saleAccount,
      tokenMint,
      amount
    )

    // Refresh sales after purchase
    await fetchSales()
    
    return signature
  }, [wallet, tokenSaleService, fetchSales])

  const getSaleData = useCallback(async (saleAccount: PublicKey) => {
    return await tokenSaleService.getSaleData(saleAccount)
  }, [tokenSaleService])

  const findSaleAccount = useCallback(async (tokenMint: PublicKey) => {
    return await tokenSaleService.findSaleAccount(tokenMint)
  }, [tokenSaleService])

  // Auto-fetch sales when wallet connects
  useEffect(() => {
    if (wallet.connected) {
      fetchSales()
    } else {
      setSales([])
      setError(null)
    }
  }, [wallet.connected, fetchSales])

  return {
    sales,
    loading,
    error,
    fetchSales,
    createSale,
    buyTokens,
    getSaleData,
    findSaleAccount,
  }
} 