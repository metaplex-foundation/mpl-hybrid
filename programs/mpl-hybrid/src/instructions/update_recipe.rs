use crate::error::MplHybridError;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use mpl_core::accounts::BaseCollectionV1;
use mpl_utils::resize_or_reallocate_account_raw;

//need to add options
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateRecipeV1Ix {
    name: Option<String>,
    uri: Option<String>,
    max: Option<u64>,
    min: Option<u64>,
    amount: Option<u64>,
    fee_amount_capture: Option<u64>,
    fee_amount_release: Option<u64>,
    sol_fee_amount_capture: Option<u64>,
    sol_fee_amount_release: Option<u64>,
    path: Option<u16>,
}

//Need to define accounts better

#[derive(Accounts)]
pub struct UpdateRecipeV1Ctx<'info> {
    #[account(
        mut,
        seeds = [
            "recipe".as_bytes(), 
            collection.key().as_ref()
            ],
        bump=recipe.bump,
    )]
    recipe: Account<'info, RecipeV1>,

    #[account(mut)]
    authority: Signer<'info>,

    /// CHECK: We check against recipe
    #[account(mut,
        address = recipe.collection
    )]
    collection: AccountInfo<'info>,

    /// CHECK: This is a user defined account
    token: Account<'info, Mint>,

    /// CHECK: This is a user defined account
    fee_location: UncheckedAccount<'info>,
    system_program: Program<'info, System>,
}

pub fn handler_update_recipe_v1(
    ctx: Context<UpdateRecipeV1Ctx>,
    ix: UpdateRecipeV1Ix,
) -> Result<()> {
    //Need to add account checks for security

    let recipe = &mut ctx.accounts.recipe;
    let collection = &mut ctx.accounts.collection;
    let authority = &mut ctx.accounts.authority;
    let token = &mut ctx.accounts.token;
    let fee_location = &mut ctx.accounts.fee_location;

    // We only fetch the Base collection to check authority.
    let collection_data =
        BaseCollectionV1::from_bytes(&collection.to_account_info().data.borrow())?;

    // Check that the collection authority is the same as the recipe authority.
    if collection_data.update_authority != authority.key() {
        return Err(MplHybridError::InvalidCollectionAuthority.into());
    }

    // We can't allow the max to be less than the min.
    if ix.max <= ix.min {
        return Err(MplHybridError::MaxMustBeGreaterThanMin.into());
    }    

    let mut size_diff: isize = 0;
    recipe.authority = authority.key();
    recipe.token = token.key();
    recipe.fee_location = fee_location.key();
    if let Some(name) = ix.name {
        size_diff += name
            .len()
            .checked_sub(recipe.name.len())
            .ok_or(MplHybridError::NumericalOverflow)? as isize;
            recipe.name = name;
    }
    if let Some(uri) = ix.uri {
        size_diff += uri
            .len()
            .checked_sub(recipe.uri.len())
            .ok_or(MplHybridError::NumericalOverflow)? as isize;
            recipe.uri = uri;
    }
    if let Some(max) = ix.max {
        recipe.max = max;
    }
    if let Some(min) = ix.min {
        recipe.min = min;
    }
    if let Some(amount) = ix.amount {
        recipe.amount = amount;
    }
    if let Some(fee_amount_capture) = ix.fee_amount_capture {
        recipe.fee_amount_capture = fee_amount_capture;
    }
    if let Some(sol_fee_amount_capture) = ix.sol_fee_amount_capture {
        recipe.sol_fee_amount_capture = sol_fee_amount_capture;
    }
    if let Some(fee_amount_release) = ix.fee_amount_release {
        recipe.fee_amount_release = fee_amount_release;
    }
    if let Some(sol_fee_amount_release) = ix.sol_fee_amount_release {
        recipe.sol_fee_amount_release = sol_fee_amount_release;
    }    
    if let Some(path) = ix.path {
        recipe.path = path;
    }

    let new_size = recipe
        .to_account_info()
        .data_len()
        .checked_add(size_diff as usize)
        .ok_or(MplHybridError::NumericalOverflow)?;
    resize_or_reallocate_account_raw(
        &recipe.to_account_info(),
        authority,
        &ctx.accounts.system_program,
        new_size,
    )?;

    Ok(())
}
