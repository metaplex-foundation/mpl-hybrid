use anchor_lang::{prelude::*, Discriminator};
use mpl_utils::{assert_derivation, create_or_allocate_account_raw};
use solana_program::program_memory::sol_memcpy;

use crate::state::{IngredientTriggerPairV1, RecipeV1};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreateRecipeV1Args {
    pub reversible: bool,
    pub inputs: Vec<IngredientTriggerPairV1>,
    pub outputs: Vec<IngredientTriggerPairV1>,
}

#[derive(Accounts)]
pub struct CreateRecipeV1<'info> {
    /// CHECK: This account is checked and initialized in the handler.
    #[account(mut)]
    pub recipe: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    system_program: Program<'info, System>,
}

pub fn handle_create_recipe_v1(
    ctx: Context<CreateRecipeV1>,
    args: CreateRecipeV1Args,
) -> Result<()> {
    let mut recipe = RecipeV1 {
        authority: *ctx.accounts.authority.key,
        count: 0,
        reversible: args.reversible,
        bump: 0,
        inputs: args.inputs.clone(),
        outputs: args.outputs,
    };

    let mut seeds = vec!["escrow".as_bytes()]
        .into_iter()
        .chain(
            args.inputs
                .iter()
                .filter_map(
                    |IngredientTriggerPairV1 {
                         ingredient,
                         trigger: _,
                     }| ingredient.get_key_seed(),
                )
                .collect::<Vec<&[u8]>>(),
        )
        .collect::<Vec<&[u8]>>();

    let bump = assert_derivation(
        &crate::ID,
        &ctx.accounts.recipe,
        &seeds,
        ProgramError::Custom(ErrorCode::ConstraintSeeds as u32),
    )?;

    recipe.bump = bump;

    let binding = [bump];
    seeds.push(&binding);

    let mut recipe_data = RecipeV1::DISCRIMINATOR.to_vec();
    recipe_data.extend(recipe.try_to_vec()?);
    create_or_allocate_account_raw(
        crate::ID,
        &ctx.accounts.recipe,
        &ctx.accounts.system_program,
        &ctx.accounts.authority,
        recipe_data.len(),
        &seeds,
    )?;

    let mut escrow_data_borrowed = ctx.accounts.recipe.data.borrow_mut();
    sol_memcpy(&mut escrow_data_borrowed, &recipe_data, recipe_data.len());

    Ok(())
}
