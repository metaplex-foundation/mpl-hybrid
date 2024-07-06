use anchor_lang::{prelude::*, Discriminator};
use mpl_utils::{assert_derivation_with_bump, resize_or_reallocate_account_raw};
use solana_program::program_memory::sol_memcpy;

use crate::state::{EscrowV1, RecipeV1};

#[derive(Accounts)]
pub struct MigrateEscrowV1ToRecipeV1<'info> {
    /// CHECK: We deserialize and check the escrow in the handler.
    #[account(mut)]
    pub escrow: AccountInfo<'info>,

    /// CHECK: We check against escrow in the handler.
    #[account(mut)]
    collection: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    system_program: Program<'info, System>,
}

pub fn handler_migrate_escrow_v1_to_recipe_v1(
    ctx: Context<MigrateEscrowV1ToRecipeV1>,
) -> Result<()> {
    let escrow = EscrowV1::deserialize(&mut &ctx.accounts.escrow.data.borrow_mut()[..])?;

    if ctx.accounts.escrow.owner != &crate::ID {
        return Err(ErrorCode::ConstraintOwner.into());
    }

    assert_derivation_with_bump(
        &crate::ID,
        &ctx.accounts.escrow,
        &[
            "escrow".as_bytes(),
            escrow.collection.as_ref(),
            &[escrow.bump],
        ],
        ProgramError::Custom(ErrorCode::ConstraintSeeds as u32),
    )?;

    let recipe: RecipeV1 = escrow.into();

    let mut serialized_data = RecipeV1::DISCRIMINATOR.to_vec();
    serialized_data.extend(recipe.try_to_vec()?);

    resize_or_reallocate_account_raw(
        &ctx.accounts.escrow,
        &ctx.accounts.authority,
        &ctx.accounts.system_program,
        serialized_data.len(),
    )?;

    sol_memcpy(
        &mut ctx.accounts.escrow.data.borrow_mut(),
        &serialized_data,
        serialized_data.len(),
    );

    Ok(())
}
