import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TokenSaleProgram } from "../types/token_sale_program";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";

// Program ID deployed on devnet
const PROGRAM_ID = new PublicKey("3ddS5rTMztd7w2TBh8rnCPt1vMu5rqEp8XrJCYuqH1ZL");

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

  async initializeProgram(wallet: any) {
    const provider = new anchor.AnchorProvider(
      this.connection,
      wallet,
      anchor.AnchorProvider.defaultOptions()
    );
    
    // Use the workspace to get the program
    this.program = anchor.workspace.TokenSaleProgram as Program<TokenSaleProgram>;
    if (!this.program) {
      throw new Error("Program not found in workspace");
    }
    
    return this.program;
  }

  async createTokenSale(
    wallet: any,
    tokenMint: PublicKey,
    usdcMint: PublicKey,
    startTime: number,
    endTime: number,
    pricePerToken: number,
    hardCap: number
  ): Promise<{ saleAccount: PublicKey; signature: string }> {
    if (!this.program) {
      await this.initializeProgram(wallet);
    }

    // Find PDA for sale account
    const [saleAccount] = await PublicKey.findProgramAddress(
      [Buffer.from("token_sale"), tokenMint.toBuffer()],
      PROGRAM_ID
    );

    // Compute treasury address
    const treasury = await getAssociatedTokenAddress(
      usdcMint,
      wallet.publicKey
    );

    const signature = await this.program!.methods
      .initializeSale(
        new anchor.BN(startTime),
        new anchor.BN(endTime),
        new anchor.BN(pricePerToken * 1_000_000), // Convert to micro USDC
        new anchor.BN(hardCap)
      )
      .accountsPartial({
        authority: wallet.publicKey,
        tokenMint,
        usdcMint,
        treasury,
      })
      .rpc();

    return { saleAccount, signature };
  }

  async buyTokens(
    wallet: any,
    saleAccount: PublicKey,
    tokenMint: PublicKey,
    amount: number
  ): Promise<string> {
    if (!this.program) {
      await this.initializeProgram(wallet);
    }

    // Get sale data to find USDC mint and treasury
    const saleData = await this.program!.account.tokenSale.fetch(saleAccount);
    
    // Get buyer's token accounts
    const buyerTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      wallet.publicKey
    );
    
    const buyerUsdcAccount = await getAssociatedTokenAddress(
      saleData.usdcMint,
      wallet.publicKey
    );

    const signature = await this.program!.methods
      .buyTokens(new anchor.BN(amount))
      .accountsPartial({
        buyer: wallet.publicKey,
        sale: saleAccount,
        tokenMint,
        buyerTokenAccount,
        buyerUsdcAccount,
        treasury: saleData.treasury,
        authority: saleData.authority,
      })
      .rpc();

    return signature;
  }

  async getSaleData(saleAccount: PublicKey): Promise<TokenSaleData | null> {
    if (!this.program) {
      throw new Error("Program not initialized");
    }

    try {
      const saleData = await this.program.account.tokenSale.fetch(saleAccount);
      return saleData as TokenSaleData;
    } catch (error) {
      console.error("Failed to fetch sale data:", error);
      return null;
    }
  }

  async getAllSales(): Promise<Array<{ account: PublicKey; data: TokenSaleData }>> {
    if (!this.program) {
      throw new Error("Program not initialized");
    }

    try {
      const sales = await this.program.account.tokenSale.all();
      return sales.map(sale => ({
        account: sale.publicKey,
        data: sale.account as TokenSaleData
      }));
    } catch (error) {
      console.error("Failed to fetch all sales:", error);
      return [];
    }
  }

  async findSaleAccount(tokenMint: PublicKey): Promise<PublicKey> {
    const [saleAccount] = await PublicKey.findProgramAddress(
      [Buffer.from("token_sale"), tokenMint.toBuffer()],
      PROGRAM_ID
    );
    return saleAccount;
  }

  async getUserTokenBalance(
    userPublicKey: PublicKey,
    tokenMint: PublicKey
  ): Promise<number> {
    try {
      const tokenAccount = await getAssociatedTokenAddress(tokenMint, userPublicKey);
      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      return parseInt(balance.value.amount);
    } catch {
      return 0;
    }
  }

  async createTokenAccountIfNeeded(
    wallet: any,
    tokenMint: PublicKey,
    owner: PublicKey
  ): Promise<PublicKey> {
    const tokenAccount = await getAssociatedTokenAddress(tokenMint, owner);
    
    try {
      await getAccount(this.connection, tokenAccount);
      return tokenAccount;
    } catch {
      // Account doesn't exist, create it
      await createAssociatedTokenAccount(
        this.connection,
        wallet.payer || wallet,
        tokenMint,
        owner
      );
      return tokenAccount;
    }
  }
}

// Singleton instance
let tokenSaleService: TokenSaleProgramService | null = null;

export const getTokenSaleService = (connection: Connection): TokenSaleProgramService => {
  if (!tokenSaleService) {
    tokenSaleService = new TokenSaleProgramService(connection);
  }
  return tokenSaleService;
}; 