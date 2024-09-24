use anchor_lang::prelude::*;
use solana_program::{program::invoke, program_pack::Pack};
use spl_token::state::Account;

use crate::error::MplHybridError;

pub fn create_associated_token_account<'info>(
    payer: &AccountInfo<'info>,
    owner: &AccountInfo<'info>,
    mint: &AccountInfo<'info>,
    token_account: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
) -> Result<()> {
    invoke(
        &spl_associated_token_account::instruction::create_associated_token_account(
            &payer.key(),
            &owner.key(),
            &mint.key(),
            &spl_token::ID,
        ),
        &[
            payer.clone(),
            owner.clone(),
            mint.clone(),
            token_account.clone(),
            token_program.clone(),
            system_program.clone(),
        ],
    )
    .map_err(Into::into)
}

pub fn validate_token_account(
    account: &AccountInfo<'_>,
    owner: &Pubkey,
    mint: &Pubkey,
) -> Result<()> {
    let account_data = Account::unpack(&account.data.borrow())?;
    if account.owner != &spl_token::ID {
        return Err(MplHybridError::InvalidTokenAccount.into());
    } else if account_data.owner != *owner {
        return Err(MplHybridError::InvalidTokenAccountOwner.into());
    } else if account_data.mint != *mint {
        return Err(MplHybridError::InvalidTokenAccountMint.into());
    }

    Ok(())
}
