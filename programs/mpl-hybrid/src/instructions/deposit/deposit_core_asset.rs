use anchor_lang::prelude::*;
use mpl_core::{
    accounts::BaseAssetV1,
    instructions::{TransferV1Cpi, TransferV1InstructionArgs},
    types::UpdateAuthority,
};
use mpl_utils::assert_derivation_with_bump;

use crate::{
    error::MplHybridError,
    state::{IngredientTriggerPairV1, IngredientV1, RecipeChecklistV1, RecipeV1},
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct DepositCoreAssetV1Args {
    pub reversed: bool,
}

#[derive(Accounts)]
pub struct DepositCoreAssetV1<'info> {
    /// CHECK: The PDA derivation is checked in the handler.
    #[account(mut)]
    pub recipe: Account<'info, RecipeV1>,

    #[account(
        mut,
        seeds = [
            "checklist".as_bytes(),
            recipe.key().as_ref(),
            payer.key().as_ref(),
        ],
        bump=checklist.bump,
    )]
    pub checklist: Account<'info, RecipeChecklistV1>,

    /// CHECK: We check the asset in the handler.
    #[account(mut)]
    asset: AccountInfo<'info>,

    /// CHECK: We check the collection in the handler.
    collection: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: We check against constant
    #[account(
        address = mpl_core::ID @ MplHybridError::InvalidMplCore
    )]
    mpl_core: AccountInfo<'info>,
    system_program: Program<'info, System>,
}

pub fn handle_deposit_core_asset_v1(
    ctx: Context<DepositCoreAssetV1>,
    args: DepositCoreAssetV1Args,
) -> Result<()> {
    // Guards
    let mut seeds = vec!["escrow".as_bytes()]
        .into_iter()
        .chain(ctx.accounts.recipe.get_input_keys())
        .collect::<Vec<&[u8]>>();

    let bump_seed = &[ctx.accounts.recipe.bump];
    seeds.push(bump_seed);

    // Check the account derivation.
    assert_derivation_with_bump(
        &crate::ID,
        &ctx.accounts.recipe.to_account_info(),
        &seeds,
        ProgramError::Custom(ErrorCode::ConstraintSeeds as u32),
    )?;

    // Perform the side effects.
    let (ingredients, checks) = match args.reversed {
        true => (
            &ctx.accounts.recipe.outputs,
            &mut ctx.accounts.checklist.outputs,
        ),
        false => (
            &ctx.accounts.recipe.inputs,
            &mut ctx.accounts.checklist.inputs,
        ),
    };

    // We only fetch the Base assets because we only need to check the collection here.
    let asset_data = BaseAssetV1::from_bytes(&ctx.accounts.asset.to_account_info().data.borrow())?;

    let position = if let UpdateAuthority::Collection(core_collection) = asset_data.update_authority
    {
        ingredients.iter().zip(checks.iter()).position(
            |(
                IngredientTriggerPairV1 {
                    ingredient,
                    trigger: _trigger,
                },
                checked,
            )| {
                !checked.ingredient_checked
                    && (matches!(ingredient, IngredientV1::CoreCollection(collection) if *collection == core_collection) || matches!(ingredient, IngredientV1::CoreAsset(asset) if *asset == ctx.accounts.asset.key()))
            },
        )
    } else {
        None
    };

    match position {
        Some(position) => {
            checks[position].ingredient_checked = true;
            TransferV1Cpi {
                __program: &ctx.accounts.mpl_core.to_account_info(),
                asset: &ctx.accounts.asset.to_account_info(),
                collection: Some(&ctx.accounts.collection),
                payer: &ctx.accounts.payer.to_account_info(),
                authority: None,
                new_owner: &ctx.accounts.recipe.to_account_info(),
                system_program: Some(&ctx.accounts.system_program),
                log_wrapper: None,
                __args: TransferV1InstructionArgs {
                    compression_proof: None,
                },
            }
            .invoke()?;
        }
        None => return Err(MplHybridError::InvalidIngredient.into()),
    }

    Ok(())
}
