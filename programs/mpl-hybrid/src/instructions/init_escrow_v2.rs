use crate::state::*;
use anchor_lang::{prelude::*, Discriminator};
use mpl_utils::create_or_allocate_account_raw;
use solana_program::program_memory::sol_memcpy;


#[derive(Accounts)]
pub struct InitEscrowV2Ctx<'info> {
    /// CHECK: This account is checked and initialized in the handler.
    #[account(
        mut,
        seeds = [
            "escrow".as_bytes(), 
            authority.key().as_ref()
            ],
        bump,
    )]
    escrow: AccountInfo<'info>,

    #[account(mut)]
    authority: Signer<'info>,

    system_program: Program<'info, System>
}

pub fn handler_init_escrow_v2(ctx: Context<InitEscrowV2Ctx>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    create_or_allocate_account_raw(
        crate::ID,
        escrow,
        &ctx.accounts.system_program.to_account_info(),
        &ctx.accounts.authority.to_account_info(),
        EscrowV2::BASE_ESCROW_V2_SIZE,
        &[
            "escrow".as_bytes(),
            &ctx.accounts.authority.key.to_bytes(),
            &[ctx.bumps.escrow],
        ],
    )?;

    let authority = &mut ctx.accounts.authority;

    //initialize with input data
    let mut escrow_data = EscrowV2::DISCRIMINATOR.to_vec();
    escrow_data.extend(
        EscrowV2 {
            authority: authority.key(),
            bump: ctx.bumps.escrow
        }
        .try_to_vec()?,
    );

    let mut escrow_data_borrowed = escrow.data.borrow_mut();
    sol_memcpy(&mut escrow_data_borrowed, &escrow_data, escrow_data.len());

    Ok(())
}
