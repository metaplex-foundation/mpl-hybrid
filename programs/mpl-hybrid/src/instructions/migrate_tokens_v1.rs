use crate::constants::*;
use crate::error::MplHybridError;
use crate::state::*;
use crate::utils::{create_associated_token_account, validate_token_account};
use anchor_lang::prelude::*;
use anchor_lang::{
    accounts::{program::Program, signer::Signer},
    system_program::System,
};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token;
use anchor_spl::token::Mint;
use anchor_spl::token::{Token, Transfer};
use mpl_core::accounts::BaseAssetV1;
use mpl_core::instructions::{
    TransferV1Cpi, TransferV1InstructionArgs, UpdateV1Cpi, UpdateV1InstructionArgs,
};
use mpl_core::types::UpdateAuthority;
use mpl_utils::assert_signer;
use solana_program::program::invoke;
use solana_program::system_program;


#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct MigrateTokensV1Ix {
    amount: u64
}

#[derive(Accounts)]
pub struct MigrateTokensV1Ctx<'info> {

    #[account(mut)]
    authority: Signer<'info>,

    #[account(
        mut,
        seeds = [
            "escrow".as_bytes(), 
            authority.key().as_ref()
            ],
        bump=escrow_new.bump,
    )]
    escrow_new: Account<'info, EscrowV2>,

    #[account(
        mut,
        seeds = [
            "escrow".as_bytes(), 
            collection.key().as_ref()
            ],
        bump=escrow_old.bump,
    )]
    escrow_old: Account<'info, EscrowV1>,

    /// CHECK: We check against escrow
    #[account(mut,
        address = escrow_old.collection
    )]
    collection: AccountInfo<'info>,

    /// CHECK: We check and initialize the token account below.
    #[account(mut)]
    escrow_new_token_account: AccountInfo<'info>,

    /// CHECK: We check the token account below.
    #[account(mut)]
    escrow_old_token_account: AccountInfo<'info>,

    /// CHECK: This is a user defined account
    #[account(
        address = escrow_old.token @MplHybridError::InvalidMintAccount
    )]
    token: Account<'info, Mint>,

    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handler_migrate_tokens_v1(ctx: Context<MigrateTokensV1Ctx>, ix: MigrateTokensV1Ix) -> Result<()> {
    //Need to add account checks for security
    let authority = &mut ctx.accounts.authority;
    let escrow_new = &mut ctx.accounts.escrow_new;
    let escrow_old = &mut ctx.accounts.escrow_old;
    let collection = &mut ctx.accounts.collection;
    let escrow_new_token_account = &mut ctx.accounts.escrow_new_token_account;
    let escrow_old_token_account = &mut ctx.accounts.escrow_old_token_account;
    let token = &mut ctx.accounts.token;
    let system_program = &mut ctx.accounts.system_program;
    let token_program = &mut ctx.accounts.token_program;

    // Create idempotent
    if escrow_new_token_account.owner == &system_program::ID {
        solana_program::msg!("Creating user token account");
        create_associated_token_account(
            authority,
            &escrow_new.to_account_info(),
            &token.to_account_info(),
            escrow_new_token_account,
            token_program,
            system_program,
        )?;
    } else {
        validate_token_account(escrow_new_token_account, &escrow_new.key(), &token.key())?;
    }

    // The escrow token account should already exist.
    validate_token_account(
        escrow_old_token_account,
        &escrow_old.key(),
        &token.key(),
    )?;

    //create transfer token instruction
    let cpi_program = token_program.to_account_info();

    let signer_seeds = &[b"escrow", collection.key.as_ref(), &[escrow_old.bump]];

    let signer = &[&signer_seeds[..]];

    let cpi_accounts_transfer = Transfer {
        from: escrow_old_token_account.to_account_info(),
        to: escrow_new_token_account.to_account_info(),
        authority: escrow_old.to_account_info(),
    };

    let transfer_cpi_ctx =
        CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts_transfer, signer);

    token::transfer(transfer_cpi_ctx, ix.amount)?;

    Ok(())
}
