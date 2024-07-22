use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use mpl_utils::assert_derivation_with_bump;
use solana_program::program::invoke;

use crate::{
    error::MplHybridError,
    state::{IngredientTriggerPairV1, IngredientV1, RecipeChecklistV1, RecipeV1},
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct DepositSplTokenV1Args {
    pub reversed: bool,
}

#[derive(Accounts)]
pub struct DepositSplTokenV1<'info> {
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

    #[account(mut,
        associated_token::mint = mint,
        associated_token::authority = payer
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = recipe
    )]
    pub recipe_token_account: Account<'info, TokenAccount>,

    /// CHECK: This account is checked in the handler.
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handle_deposit_spl_token_v1(
    ctx: Context<DepositSplTokenV1>,
    args: DepositSplTokenV1Args,
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

    let position =
        ingredients.iter().zip(checks.iter()).position(
            |(
                IngredientTriggerPairV1 {
                    ingredient,
                    trigger: _trigger,
                },
                checked,
            )| {
                !checked.ingredient_checked
                    && matches!(ingredient, IngredientV1::SplToken(mint, _) if *mint == ctx.accounts.mint.key())
            },
        );

    match position {
        Some(position) => {
            checks[position].ingredient_checked = true;
            invoke(
                &spl_token::instruction::transfer(
                    ctx.accounts.token_program.key,
                    &ctx.accounts.user_token_account.key(),
                    &ctx.accounts.recipe_token_account.key(),
                    ctx.accounts.payer.key,
                    &[],
                    *ingredients[position].ingredient.as_spl_token().unwrap().1,
                )?,
                &[
                    ctx.accounts.token_program.to_account_info(),
                    ctx.accounts.user_token_account.to_account_info(),
                    ctx.accounts.recipe_token_account.to_account_info(),
                    ctx.accounts.payer.to_account_info(),
                ],
            )?;
        }
        None => return Err(MplHybridError::InvalidIngredient.into()),
    }

    Ok(())
}
