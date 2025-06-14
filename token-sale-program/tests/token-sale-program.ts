import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TokenSaleProgram } from "../target/types/token_sale_program";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("token-sale-program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TokenSaleProgram as Program<TokenSaleProgram>;
  
  let tokenMint: anchor.web3.PublicKey;
  let usdcMint: anchor.web3.PublicKey;
  let treasury: anchor.web3.PublicKey;
  let sale: anchor.web3.PublicKey;
  let saleBump: number;

  const startTime = Math.floor(Date.now() / 1000);
  const endTime = startTime + 3600; // 1 hour from now
  const pricePerToken = new anchor.BN(1_000_000); // 1 USDC per token
  const hardCap = new anchor.BN(1_000_000_000); // 1000 tokens

  before(async () => {
    // Create token mint
    tokenMint = await createMint(
      provider.connection,
      provider.wallet.payer as anchor.web3.Signer,
      provider.wallet.publicKey,
      null,
      9
    );

    // Create USDC mint
    usdcMint = await createMint(
      provider.connection,
      provider.wallet.payer as anchor.web3.Signer,
      provider.wallet.publicKey,
      null,
      6
    );

    // Compute treasury address (don't create it, let Anchor create it)
    treasury = await anchor.utils.token.associatedAddress({
      mint: usdcMint,
      owner: provider.wallet.publicKey,
    });

    // Find PDA for sale account
    [sale, saleBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("token_sale"), tokenMint.toBuffer()],
      program.programId
    );
  });

  it("Initializes the token sale", async () => {
    const tx = await program.methods
      .initializeSale(
        new anchor.BN(startTime),
        new anchor.BN(endTime),
        pricePerToken,
        hardCap
      )
      .accountsPartial({
        authority: provider.wallet.publicKey,
        tokenMint,
        usdcMint,
        treasury,
      })
      .signers([provider.wallet.payer as anchor.web3.Signer])
      .rpc();

    const saleAccount = await program.account.tokenSale.fetch(sale);
    assert.ok(saleAccount.authority.equals(provider.wallet.publicKey));
    assert.ok(saleAccount.tokenMint.equals(tokenMint));
    assert.ok(saleAccount.usdcMint.equals(usdcMint));
    assert.ok(saleAccount.treasury.equals(treasury));
    assert.ok(saleAccount.startTime.eq(new anchor.BN(startTime)));
    assert.ok(saleAccount.endTime.eq(new anchor.BN(endTime)));
    assert.ok(saleAccount.pricePerToken.eq(pricePerToken));
    assert.ok(saleAccount.hardCap.eq(hardCap));
    assert.ok(saleAccount.totalSold.eq(new anchor.BN(0)));
    assert.equal(saleAccount.isActive, false);
  });

  it("Allows buying tokens", async () => {
    // Create a separate buyer keypair
    const buyer = anchor.web3.Keypair.generate();
    
    // Airdrop SOL to buyer for transaction fees
    await provider.connection.requestAirdrop(buyer.publicKey, 1000000000);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for airdrop

    // Create buyer token account
    const buyerTokenAccount = await createAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer as anchor.web3.Signer,
      tokenMint,
      buyer.publicKey
    );

    // Create buyer USDC account
    const buyerUsdcAccount = await createAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer as anchor.web3.Signer,
      usdcMint,
      buyer.publicKey
    );

    // Mint USDC to buyer
    await mintTo(
      provider.connection,
      provider.wallet.payer as anchor.web3.Signer,
      usdcMint,
      buyerUsdcAccount,
      provider.wallet.publicKey,
      1_000_000_000 // 1000 USDC
    );

    const amount = new anchor.BN(100); // Buy 100 tokens

    const tx = await program.methods
      .buyTokens(amount)
      .accountsPartial({
        buyer: buyer.publicKey,
        sale,
        tokenMint,
        buyerTokenAccount,
        buyerUsdcAccount,
        treasury,
        authority: provider.wallet.publicKey,
      })
      .signers([buyer])
      .rpc();

    // Check buyer's token balance
    const buyerTokenBalance = await getAccount(
      provider.connection,
      buyerTokenAccount
    );
    assert.equal(Number(buyerTokenBalance.amount), 100);

    // Check treasury USDC balance
    const treasuryBalance = await getAccount(provider.connection, treasury);
    assert.equal(Number(treasuryBalance.amount), 100_000_000); // 100 USDC

    // Check sale state
    const saleAccount = await program.account.tokenSale.fetch(sale);
    assert.ok(saleAccount.totalSold.eq(amount));
  });
});
