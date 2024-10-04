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
pub struct InitRecipeV1Ix {
    name: String,
    uri: String,
    max: u64,
    min: u64,
    amount: u64,
    fee_amount_capture: u64,
    fee_amount_release: u64,
    sol_fee_amount_capture: u64,
    sol_fee_amount_release: u64,
    path: u16,
}

#[derive(Accounts)]
pub struct InitRecipeV1Ctx<'info> {
    /// CHECK: This account is checked and initialized in the handler.
    #[account(
        mut,
        seeds = [
            "recipe".as_bytes(), 
            collection.key().as_ref()
            ],
        bump,
    )]
    recipe: AccountInfo<'info>,

    #[account(mut)]
    authority: Signer<'info>,

    /// CHECK: We check the collection bellow and with recipe seeds
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

pub fn handler_init_recipe_v1(ctx: Context<InitRecipeV1Ctx>, ix: InitRecipeV1Ix) -> Result<()> {
    let recipe = &mut ctx.accounts.recipe;
    create_or_allocate_account_raw(
        crate::ID,
        recipe,
        &ctx.accounts.system_program.to_account_info(),
        &ctx.accounts.authority.to_account_info(),
        RecipeV1::BASE_RECIPE_SIZE + ix.name.len() + ix.uri.len(),
        &[
            "recipe".as_bytes(),
            &ctx.accounts.collection.key.to_bytes(),
            &[ctx.bumps.recipe],
        ],
    )?;

    let collection = &mut ctx.accounts.collection;
    let authority = &mut ctx.accounts.authority;
    let token = &mut ctx.accounts.token;
    let fee_location = &mut ctx.accounts.fee_location;

    // We can't allow the max to be less than the min.
    if ix.max < ix.min {
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

    // Check that the collection authority is the same as the recipe authority.
    if collection_data.update_authority != authority.key() {
        return Err(MplHybridError::InvalidCollectionAuthority.into());
    }

    //initialize with input data
    let mut recipe_data = RecipeV1::DISCRIMINATOR.to_vec();
    recipe_data.extend(
        RecipeV1 {
            collection: collection.key(),
            authority: authority.key(),
            token: token.key(),
            fee_location: fee_location.key(),
            name: ix.name,
            uri: ix.uri,
            max: ix.max,
            min: ix.min,
            amount: ix.amount,
            fee_amount_capture: ix.fee_amount_capture,
            sol_fee_amount_capture: ix.sol_fee_amount_capture,
            fee_amount_release: ix.fee_amount_release,
            sol_fee_amount_release: ix.sol_fee_amount_release,
            count: 1,
            path: ix.path,
            bump: ctx.bumps.recipe,
        }
        .try_to_vec()?,
    );

    let mut recipe_data_borrowed = recipe.data.borrow_mut();
    sol_memcpy(&mut recipe_data_borrowed, &recipe_data, recipe_data.len());

    Ok(())
}
