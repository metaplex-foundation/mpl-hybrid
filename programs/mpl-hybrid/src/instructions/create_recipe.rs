use anchor_lang::prelude::*;
use mpl_utils::assert_derivation;

use crate::state::{IngredientTriggerPairV1, RecipeV1};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateRecipeArgs {
    pub reversible: bool,
    pub inputs: Vec<IngredientTriggerPairV1>,
    pub outputs: Vec<IngredientTriggerPairV1>,
}

#[derive(Accounts)]
pub struct CreateRecipe<'info> {
    /// CHECK: This account is checked and initialized in the handler.
    #[account(mut)]
    pub recipe: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    system_program: Program<'info, System>,
}

pub fn handle_create_recipe(ctx: Context<CreateRecipe>, args: CreateRecipeArgs) -> Result<()> {
    let mut recipe = RecipeV1 {
        authority: *ctx.accounts.authority.key,
        count: 0,
        reversible: args.reversible,
        bump: 0,
        inputs: args.inputs,
        outputs: args.outputs,
    };

    let seeds = vec!["escrow".as_bytes()]
        .into_iter()
        .chain(recipe.get_input_keys())
        .collect::<Vec<&[u8]>>();

    let bump = assert_derivation(
        &crate::ID,
        &ctx.accounts.recipe,
        &seeds,
        ProgramError::Custom(ErrorCode::ConstraintSeeds as u32),
    )?;

    recipe.bump = bump;
    Ok(())
}
