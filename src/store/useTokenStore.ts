import { create } from 'zustand'
import { PublicKey } from '@solana/web3.js'

export interface TokenInfo {
  mint: PublicKey
  name: string
  symbol: string
  decimals: number
  supply: number
  description?: string
  image?: string
  creator: PublicKey
  createdAt: Date
}

export interface TokenSale {
  id: string
  tokenMint: PublicKey
  pricePerToken: number // in USDC
  totalTokens: number
  soldTokens: number
  startTime: Date
  endTime: Date
  vestingPeriod?: number // in days
  minPurchase?: number
  maxPurchase?: number
  isActive: boolean
  requiresVerification: boolean
  verificationMethod?: 'reclaim' | 'solana-attestation'
}

export interface TokenDistribution {
  id: string
  tokenMint: PublicKey
  totalTokens: number
  claimedTokens: number
  eligibilityRules: string[]
  verificationMethod: 'reclaim' | 'solana-attestation'
  isActive: boolean
  startTime: Date
  endTime?: Date
}

interface TokenState {
  tokens: TokenInfo[]
  sales: TokenSale[]
  distributions: TokenDistribution[]
  userTokens: { [mint: string]: number }
  addToken: (token: TokenInfo) => void
  addSale: (sale: TokenSale) => void
  addDistribution: (distribution: TokenDistribution) => void
  updateUserTokenBalance: (mint: string, balance: number) => void
  updateSale: (saleId: string, updates: Partial<TokenSale>) => void
  updateDistribution: (distributionId: string, updates: Partial<TokenDistribution>) => void
}

export const useTokenStore = create<TokenState>((set) => ({
  tokens: [],
  sales: [],
  distributions: [],
  userTokens: {},
  addToken: (token) => set((state) => ({ tokens: [...state.tokens, token] })),
  addSale: (sale) => set((state) => ({ sales: [...state.sales, sale] })),
  addDistribution: (distribution) => set((state) => ({ distributions: [...state.distributions, distribution] })),
  updateUserTokenBalance: (mint, balance) => 
    set((state) => ({ userTokens: { ...state.userTokens, [mint]: balance } })),
  updateSale: (saleId, updates) => 
    set((state) => ({
      sales: state.sales.map(sale => 
        sale.id === saleId ? { ...sale, ...updates } : sale
      )
    })),
  updateDistribution: (distributionId, updates) => 
    set((state) => ({
      distributions: state.distributions.map(dist => 
        dist.id === distributionId ? { ...dist, ...updates } : dist
      )
    })),
})) 