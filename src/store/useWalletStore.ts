import { create } from 'zustand'
import { Connection, PublicKey } from '@solana/web3.js'

interface WalletState {
  connected: boolean
  publicKey: PublicKey | null
  connection: Connection | null
  balance: number
  setWallet: (publicKey: PublicKey | null, connected: boolean) => void
  setConnection: (connection: Connection) => void
  setBalance: (balance: number) => void
  disconnect: () => void
}

export const useWalletStore = create<WalletState>((set) => ({
  connected: false,
  publicKey: null,
  connection: null,
  balance: 0,
  setWallet: (publicKey, connected) => set({ publicKey, connected }),
  setConnection: (connection) => set({ connection }),
  setBalance: (balance) => set({ balance }),
  disconnect: () => set({ connected: false, publicKey: null, balance: 0 }),
})) 