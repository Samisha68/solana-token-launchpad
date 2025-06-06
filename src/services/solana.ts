import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  getAssociatedTokenAddress,
} from '@solana/spl-token'

export class SolanaService {
  private connection: Connection

  constructor(rpcUrl?: string) {
    // Use a better RPC endpoint with higher rate limits
    const endpoint = rpcUrl || this.getBestRpcEndpoint()
    this.connection = new Connection(endpoint, 'confirmed')
  }

  private getBestRpcEndpoint(): string {
    // List of reliable RPC endpoints (you can add your own paid endpoints here)
    const endpoints = [
      'https://solana-api.projectserum.com',
      'https://rpc.ankr.com/solana',
      'https://solana-mainnet.rpc.extrnode.com',
      'https://api.mainnet-beta.solana.com', // Fallback to official
    ]
    
    // For development, you might want to use a specific endpoint
    return endpoints[0]
  }

  async getBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(publicKey)
      return balance / LAMPORTS_PER_SOL
    } catch (error: unknown) {
      console.error('Failed to fetch balance with primary RPC:', error)
      
      // If we get a 403 or rate limit error, try with alternative endpoints
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('403') || errorMessage.includes('429') || errorMessage.includes('Access forbidden')) {
        console.log('Retrying with alternative RPC endpoints...')
        
        const alternativeEndpoints = [
          'https://rpc.ankr.com/solana',
          'https://solana-mainnet.rpc.extrnode.com',
          'https://mainnet.helius-rpc.com/?api-key=public',
        ]
        
        for (const endpoint of alternativeEndpoints) {
          try {
            console.log(`Trying endpoint: ${endpoint}`)
            const alternativeConnection = new Connection(endpoint, 'confirmed')
            const balance = await alternativeConnection.getBalance(publicKey)
            console.log(`Successfully got balance from ${endpoint}`)
            return balance / LAMPORTS_PER_SOL
          } catch (retryError: unknown) {
            const retryErrorMessage = retryError instanceof Error ? retryError.message : String(retryError)
            console.warn(`Failed with ${endpoint}:`, retryErrorMessage)
            continue
          }
        }
        
        console.error('All RPC endpoints failed')
        throw new Error('Unable to fetch balance: All RPC endpoints are unavailable')
      }
      
      throw error
    }
  }

  async createToken(
    payer: Keypair,
    mintAuthority: PublicKey,
    freezeAuthority: PublicKey | null,
    decimals: number
  ): Promise<PublicKey> {
    const mint = await createMint(
      this.connection,
      payer,
      mintAuthority,
      freezeAuthority,
      decimals
    )
    return mint
  }

  async mintTokens(
    payer: Keypair,
    mint: PublicKey,
    destination: PublicKey,
    authority: Keypair,
    amount: number
  ): Promise<string> {
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      payer,
      mint,
      destination
    )

    const signature = await mintTo(
      this.connection,
      payer,
      mint,
      tokenAccount.address,
      authority,
      amount
    )

    return signature
  }

  async transferTokens(
    payer: Keypair,
    source: PublicKey,
    destination: PublicKey,
    mint: PublicKey,
    amount: number
  ): Promise<string> {
    const sourceTokenAccount = await getAssociatedTokenAddress(mint, source)
    const destinationTokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      payer,
      mint,
      destination
    )

    const signature = await transfer(
      this.connection,
      payer,
      sourceTokenAccount,
      destinationTokenAccount.address,
      source,
      amount
    )

    return signature
  }

  async getTokenBalance(owner: PublicKey, mint: PublicKey): Promise<number> {
    try {
      const tokenAccount = await getAssociatedTokenAddress(mint, owner)
      const balance = await this.connection.getTokenAccountBalance(tokenAccount)
      return parseInt(balance.value.amount)
    } catch {
      return 0
    }
  }

  async createTokenSaleProgram(
    payer: Keypair
  ): Promise<PublicKey> {
    // This would typically involve deploying a custom program
    // For now, we'll create a simple escrow account
    const escrowAccount = Keypair.generate()
    
    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: escrowAccount.publicKey,
        lamports: await this.connection.getMinimumBalanceForRentExemption(0),
        space: 0,
        programId: SystemProgram.programId,
      })
    )

    await sendAndConfirmTransaction(this.connection, transaction, [payer, escrowAccount])
    return escrowAccount.publicKey
  }

  async purchaseTokens(
    buyer: Keypair,
    saleAccount: PublicKey,
    tokenMint: PublicKey,
    usdcMint: PublicKey,
    tokenAmount: number,
    usdcAmount: number
  ): Promise<string> {
    // This would interact with the token sale program
    // For now, we'll simulate a simple transfer
    const signature = await this.transferTokens(
      buyer,
      buyer.publicKey,
      saleAccount,
      usdcMint,
      usdcAmount
    )
    
    return signature
  }

  async claimFreeTokens(
    claimer: Keypair,
    distributionAccount: PublicKey,
    tokenMint: PublicKey,
    amount: number
  ): Promise<string> {
    // This would interact with a distribution program
    // For now, we'll simulate a simple transfer
    const signature = await this.transferTokens(
      claimer,
      distributionAccount,
      claimer.publicKey,
      tokenMint,
      amount
    )
    
    return signature
  }
}

export const solanaService = new SolanaService() 