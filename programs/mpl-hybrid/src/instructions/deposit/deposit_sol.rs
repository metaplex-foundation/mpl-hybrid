use anchor_lang::prelude::*;
use mpl_utils::assert_derivation_with_bump;
use solana_program::{program::invoke, system_instruction};

use crate::{
    error::MplHybridError,
    state::{IngredientTriggerPairV1, IngredientV1, RecipeChecklistV1, RecipeV1},
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct DepositSolArgs {
    pub reversed: bool,
}

#[derive(Accounts)]
pub struct DepositSol<'info> {
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

    #[account(mut)]
    pub payer: Signer<'info>,

    system_program: Program<'info, System>,
}

pub fn handle_deposit_sol(ctx: Context<DepositSol>, args: DepositSolArgs) -> Result<()> {
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

    let position = ingredients.iter().zip(checks.iter()).position(
        |(
            IngredientTriggerPairV1 {
                ingredient,
                trigger: _trigger,
            },
            checked,
        )| { !checked.ingredient_checked && matches!(ingredient, IngredientV1::Sol(_)) },
    );

    match position {
        Some(position) => {
            checks[position].ingredient_checked = true;
            invoke(
                &system_instruction::transfer(
                    ctx.accounts.payer.key,
                    &ctx.accounts.recipe.key(),
                    // This is safe because we checked the ingredient type in the position.
                    *ingredients[position].ingredient.as_sol().unwrap(),
                ),
                &[
                    ctx.accounts.payer.to_account_info(),
                    ctx.accounts.recipe.to_account_info(),
                ],
            )?
        }
        None => return Err(MplHybridError::InvalidIngredient.into()),
    }

    Ok(())
}
