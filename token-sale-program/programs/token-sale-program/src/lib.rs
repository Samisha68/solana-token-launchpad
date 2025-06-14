use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod token_sale_program {
    use super::*;

    pub fn initialize_sale(
        ctx: Context<InitializeSale>,
        start_time: i64,
        end_time: i64,
        price_per_token: u64,
        hard_cap: u64,
    ) -> Result<()> {
        let sale = &mut ctx.accounts.sale;
        sale.authority = ctx.accounts.authority.key();
        sale.token_mint = ctx.accounts.token_mint.key();
        sale.usdc_mint = ctx.accounts.usdc_mint.key();
        sale.treasury = ctx.accounts.treasury.key();
        sale.start_time = start_time;
        sale.end_time = end_time;
        sale.price_per_token = price_per_token;
        sale.hard_cap = hard_cap;
        sale.total_sold = 0;
        sale.is_active = false;
        Ok(())
    }

    pub fn buy_tokens(ctx: Context<BuyTokens>, amount: u64) -> Result<()> {
        let sale = &mut ctx.accounts.sale;
        let clock = Clock::get()?;
        
        // Check if sale is active
        require!(
            clock.unix_timestamp >= sale.start_time && clock.unix_timestamp <= sale.end_time,
            TokenSaleError::SaleNotActive
        );

        // Check if hard cap is reached
        require!(
            sale.total_sold.checked_add(amount).unwrap() <= sale.hard_cap,
            TokenSaleError::HardCapReached
        );

        // Calculate USDC amount
        let usdc_amount = amount.checked_mul(sale.price_per_token).unwrap();

        // Transfer USDC from buyer to treasury
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.buyer_usdc_account.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                    authority: ctx.accounts.buyer.to_account_info(),
                },
            ),
            usdc_amount,
        )?;

        // Mint tokens to buyer
        anchor_spl::token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::MintTo {
                    mint: ctx.accounts.token_mint.to_account_info(),
                    to: ctx.accounts.buyer_token_account.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        // Update sale state
        sale.total_sold = sale.total_sold.checked_add(amount).unwrap();

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeSale<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = TokenSale::LEN,
        seeds = [b"token_sale", token_mint.key().as_ref()],
        bump
    )]
    pub sale: Account<'info, TokenSale>,
    
    pub token_mint: Account<'info, Mint>,
    pub usdc_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        associated_token::mint = usdc_mint,
        associated_token::authority = authority,
    )]
    pub treasury: Account<'info, TokenAccount>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BuyTokens<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(mut)]
    pub sale: Account<'info, TokenSale>,
    
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = buyer,
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = sale.usdc_mint,
        associated_token::authority = buyer,
    )]
    pub buyer_usdc_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = sale.usdc_mint,
        associated_token::authority = sale.authority,
    )]
    pub treasury: Account<'info, TokenAccount>,
    
    /// CHECK: This is the authority that can mint tokens
    pub authority: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[account]
pub struct TokenSale {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub usdc_mint: Pubkey,
    pub treasury: Pubkey,
    pub start_time: i64,
    pub end_time: i64,
    pub price_per_token: u64,
    pub hard_cap: u64,
    pub total_sold: u64,
    pub is_active: bool,
}

impl TokenSale {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // token_mint
        32 + // usdc_mint
        32 + // treasury
        8 +  // start_time
        8 +  // end_time
        8 +  // price_per_token
        8 +  // hard_cap
        8 +  // total_sold
        1;   // is_active
}

#[error_code]
pub enum TokenSaleError {
    #[msg("Sale is not active")]
    SaleNotActive,
    #[msg("Hard cap reached")]
    HardCapReached,
}
