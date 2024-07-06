use anchor_lang::prelude::*;
use mpl_utils::assert_derivation_with_bump;

use crate::state::{CheckPairV1, IngredientTriggerPairV1, RecipeChecklistV1, RecipeV1};

#[derive(Accounts)]
pub struct CreateChecklist<'info> {
    /// CHECK: The PDA derivation is checked in the handler.
    #[account(mut)]
    pub recipe: Account<'info, RecipeV1>,

    #[account(
        init,
        payer = payer,
        space = RecipeChecklistV1::BASE_LEN + recipe.inputs.len() + recipe.outputs.len(),
        seeds = [
            "checklist".as_bytes(),
            recipe.key().as_ref(),
            payer.key().as_ref(),
        ],
        bump,
    )]
    pub checklist: Account<'info, RecipeChecklistV1>,

    #[account(mut)]
    pub payer: Signer<'info>,

    system_program: Program<'info, System>,
}

pub fn handle_create_checklist(ctx: Context<CreateChecklist>) -> Result<()> {
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

    let checklist = &mut ctx.accounts.checklist;

    checklist.bump = ctx.bumps.checklist;
    checklist.inputs = ctx
        .accounts
        .recipe
        .inputs
        .iter()
        .map(
            |IngredientTriggerPairV1 {
                 ingredient,
                 trigger,
             }| CheckPairV1 {
                ingredient_checked: ingredient.is_none(),
                trigger_checked: trigger.is_none(),
            },
        )
        .collect();
    checklist.outputs = ctx
        .accounts
        .recipe
        .outputs
        .iter()
        .map(
            |IngredientTriggerPairV1 {
                 ingredient,
                 trigger,
             }| CheckPairV1 {
                ingredient_checked: ingredient.is_none(),
                trigger_checked: trigger.is_none(),
            },
        )
        .collect();

    Ok(())
}
