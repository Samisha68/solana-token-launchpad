import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { TokenSaleProgram } from "../types/token_sale_program";
import {
  createAssociatedTokenAccount,
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// Define wallet interface
interface WalletAdapter {
  publicKey: PublicKey | null;
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
}

const PROGRAM_ID = new PublicKey("3ddS5rTMztd7w2TBh8rnCPt1vMu5rqEp8XrJCYuqH1ZL");
const USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"); // Devnet USDC

export interface TokenSaleData {
  authority: PublicKey;
  tokenMint: PublicKey;
  usdcMint: PublicKey;
  treasury: PublicKey;
  startTime: anchor.BN;
  endTime: anchor.BN;
  pricePerToken: anchor.BN;
  hardCap: anchor.BN;
  totalSold: anchor.BN;
  isActive: boolean;
}

export class TokenSaleProgramService {
  private connection: Connection;
  private program: Program<TokenSaleProgram> | null = null;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async initializeProgram(wallet: WalletAdapter) {
    const provider = new anchor.AnchorProvider(
      this.connection,
      wallet as anchor.Wallet,
      anchor.AnchorProvider.defaultOptions()
    );
    
    // Create program instance directly with IDL
    const idl = await anchor.Program.fetchIdl(PROGRAM_ID, provider);
    if (!idl) {
      throw new Error("IDL not found");
    }
    
    this.program = new anchor.Program(idl, provider) as Program<TokenSaleProgram>;
    
    return this.program;
  }

  async createTokenSale(
    wallet: WalletAdapter,
    tokenMint: PublicKey,
    usdcMint: PublicKey,
    startTime: number,
    endTime: number,
    pricePerToken: number,
    hardCap: number
  ): Promise<{ saleAccount: PublicKey; signature: string }> {
    if (!this.program || !wallet.publicKey) {
      throw new Error("Program not initialized or wallet not connected");
    }

    // Find PDA for the sale account
    const [saleAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_sale"), tokenMint.toBuffer()],
      PROGRAM_ID
    );

    // Find treasury PDA - using authority and USDC mint
    const treasury = await getAssociatedTokenAddress(
      usdcMint,
      wallet.publicKey
    );

    const signature = await this.program.methods
      .initializeSale(
        new anchor.BN(startTime),
        new anchor.BN(endTime),
        new anchor.BN(pricePerToken * 1_000_000), // Convert to micro-USDC
        new anchor.BN(hardCap)
      )
      .accountsPartial({
        authority: wallet.publicKey,
        sale: saleAccount,
        tokenMint,
        usdcMint,
        treasury,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    return { saleAccount, signature };
  }

  async buyTokens(
    wallet: WalletAdapter,
    saleAccount: PublicKey,
    tokenMint: PublicKey,
    amount: number
  ): Promise<string> {
    if (!this.program || !wallet.publicKey) {
      throw new Error("Program not initialized or wallet not connected");
    }

    // Get sale data to find treasury and authority
    const saleData = await this.getSaleData(saleAccount);
    
    // Get buyer's USDC token account
    const buyerUsdcAccount = await getAssociatedTokenAddress(
      saleData.usdcMint,
      wallet.publicKey
    );

    // Get buyer's token account (for receiving tokens)
    const buyerTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      wallet.publicKey
    );

    const signature = await this.program.methods
      .buyTokens(new anchor.BN(amount))
      .accountsPartial({
        buyer: wallet.publicKey,
        sale: saleAccount,
        tokenMint,
        buyerTokenAccount,
        buyerUsdcAccount,
        treasury: saleData.treasury,
        authority: saleData.authority,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc();

    return signature;
  }

  async getSaleData(saleAccount: PublicKey): Promise<TokenSaleData> {
    if (!this.program) {
      throw new Error("Program not initialized");
    }

    const accountData = await this.program.account.tokenSale.fetch(saleAccount);
    return accountData as TokenSaleData;
  }

  async getAllSales(): Promise<{ account: PublicKey; data: TokenSaleData }[]> {
    if (!this.program) {
      throw new Error("Program not initialized");
    }

    const sales = await this.program.account.tokenSale.all();
    return sales.map(sale => ({
      account: sale.publicKey,
      data: sale.account as TokenSaleData
    }));
  }

  async findSaleAccount(tokenMint: PublicKey): Promise<PublicKey> {
    const [saleAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_sale"), tokenMint.toBuffer()],
      PROGRAM_ID
    );
    return saleAccount;
  }

  async createTokenAccountIfNeeded(
    wallet: WalletAdapter,
    tokenMint: PublicKey,
    owner: PublicKey
  ): Promise<PublicKey> {
    const associatedTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      owner
    );

    try {
      // Try to get the account
      await getAccount(this.connection, associatedTokenAccount);
      return associatedTokenAccount;
    } catch (error) {
      // Account doesn't exist, create it
      await createAssociatedTokenAccount(
        this.connection,
        wallet as any, // This is the only remaining 'any' but it's from the SPL library
        tokenMint,
        owner
      );
      return associatedTokenAccount;
    }
  }
}

// Singleton service
let tokenSaleServiceInstance: TokenSaleProgramService | null = null;

export const getTokenSaleService = (connection: Connection): TokenSaleProgramService => {
  if (!tokenSaleServiceInstance) {
    tokenSaleServiceInstance = new TokenSaleProgramService(connection);
  }
  return tokenSaleServiceInstance;
}; 