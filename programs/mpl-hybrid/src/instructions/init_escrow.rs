use crate::constants::MPL_CORE;
use crate::error::MplHybridError;
use crate::state::*;
use anchor_lang::{prelude::*, Discriminator};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};
use mpl_core::accounts::BaseCollectionV1;
use mpl_core::load_key;
use mpl_core::types::Key as MplCoreKey;
use mpl_utils::create_or_allocate_account_raw;
use solana_program::program_memory::sol_memcpy;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitEscrowV1Ix {
    name: String,
    uri: String,
    max: u64,
    min: u64,
    amount: u64,
    fee_amount: u64,
    sol_fee_amount: u64,
    path: u16,
}

#[derive(Accounts)]
pub struct InitEscrowV1Ctx<'info> {
    /// CHECK: This account is checked and initialized in the handler.
    #[account(
        mut,
        seeds = [
            "escrow".as_bytes(), 
            collection.key().as_ref()
            ],
        bump,
    )]
    escrow: AccountInfo<'info>,

    #[account(mut)]
    authority: Signer<'info>,

    /// CHECK: We check the collection bellow and with escrow seeds
    collection: UncheckedAccount<'info>,

    /// CHECK: This is a user defined account
    token: Account<'info, Mint>,

    /// CHECK: This is a user defined account
    fee_location: UncheckedAccount<'info>,

    /// The ATA for token fees to be stored
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = token,
        associated_token::authority = fee_location,
    )]
    fee_ata: Account<'info, TokenAccount>,

    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handler_init_escrow_v1(ctx: Context<InitEscrowV1Ctx>, ix: InitEscrowV1Ix) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    create_or_allocate_account_raw(
        crate::ID,
        escrow,
        &ctx.accounts.system_program.to_account_info(),
        &ctx.accounts.authority.to_account_info(),
        EscrowV1::BASE_ESCROW_SIZE + ix.name.len() + ix.uri.len(),
        &[
            "escrow".as_bytes(),
            &ctx.accounts.collection.key.to_bytes(),
            &[ctx.bumps.escrow],
        ],
    )?;

    let collection = &mut ctx.accounts.collection;
    let authority = &mut ctx.accounts.authority;
    let token = &mut ctx.accounts.token;
    let fee_location = &mut ctx.accounts.fee_location;

    // We can't allow the max to be less than the min.
    if ix.max <= ix.min {
        return Err(MplHybridError::MaxMustBeGreaterThanMin.into());
    }

    if *collection.owner != MPL_CORE
        || load_key(&collection.to_account_info(), 0)? != MplCoreKey::CollectionV1
    {
        return Err(MplHybridError::InvalidCollectionAccount.into());
    }

    // We only fetch the Base collection to check authority.
    let collection_data =
        BaseCollectionV1::from_bytes(&collection.to_account_info().data.borrow())?;

    // Check that the collection authority is the same as the escrow authority.
    if collection_data.update_authority != authority.key() {
        return Err(MplHybridError::InvalidCollectionAuthority.into());
    }

    //initialize with input data
    let mut escrow_data = EscrowV1::DISCRIMINATOR.to_vec();
    escrow_data.extend(
        EscrowV1 {
            collection: collection.key(),
            authority: authority.key(),
            token: token.key(),
            fee_location: fee_location.key(),
            name: ix.name,
            uri: ix.uri,
            max: ix.max,
            min: ix.min,
            amount: ix.amount,
            fee_amount: ix.fee_amount,
            sol_fee_amount: ix.sol_fee_amount,
            count: 1,
            path: ix.path,
            bump: ctx.bumps.escrow,
        }
        .try_to_vec()?,
    );

    let mut escrow_data_borrowed = escrow.data.borrow_mut();
    sol_memcpy(&mut escrow_data_borrowed, &escrow_data, escrow_data.len());

    Ok(())
}
