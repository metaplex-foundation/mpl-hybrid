use crate::error::MplHybridError;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use mpl_core::accounts::BaseCollectionV1;
use mpl_utils::resize_or_reallocate_account_raw;

//need to add options
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateEscrowV1Ix {
    name: Option<String>,
    uri: Option<String>,
    max: Option<u64>,
    min: Option<u64>,
    amount: Option<u64>,
    fee_amount: Option<u64>,
    sol_fee_amount: Option<u64>,
    path: Option<u16>,
}

//Need to define accounts better

#[derive(Accounts)]
pub struct UpdateEscrowV1Ctx<'info> {
    #[account(
        mut,
        seeds = [
            "escrow".as_bytes(), 
            collection.key().as_ref()
            ],
        bump=escrow.bump,
    )]
    escrow: Account<'info, EscrowV1>,

    #[account(mut)]
    authority: Signer<'info>,

    /// CHECK: We check against escrow
    #[account(mut,
        address = escrow.collection
    )]
    collection: AccountInfo<'info>,

    /// CHECK: This is a user defined account
    token: Account<'info, Mint>,

    /// CHECK: This is a user defined account
    fee_location: UncheckedAccount<'info>,
    system_program: Program<'info, System>,
}

pub fn handler_update_escrow_v1(
    ctx: Context<UpdateEscrowV1Ctx>,
    ix: UpdateEscrowV1Ix,
) -> Result<()> {
    //Need to add account checks for security

    let escrow = &mut ctx.accounts.escrow;
    let collection = &mut ctx.accounts.collection;
    let authority = &mut ctx.accounts.authority;
    let token = &mut ctx.accounts.token;
    let fee_location = &mut ctx.accounts.fee_location;

    // We only fetch the Base collection to check authority.
    let collection_data =
        BaseCollectionV1::from_bytes(&collection.to_account_info().data.borrow())?;

    // Check that the collection authority is the same as the escrow authority.
    if collection_data.update_authority != authority.key() {
        return Err(MplHybridError::InvalidCollectionAuthority.into());
    }

    // We can't allow the max to be less than the min.
    if ix.max <= ix.min {
        return Err(MplHybridError::MaxMustBeGreaterThanMin.into());
    }

    let mut size_diff: isize = 0;
    escrow.authority = authority.key();
    escrow.token = token.key();
    escrow.fee_location = fee_location.key();

    if let Some(name) = ix.name {
        size_diff += (name.len() as isize)
            .checked_sub(escrow.name.len() as isize)
            .ok_or(MplHybridError::NumericalOverflow)?;
        escrow.name = name;
    }

    if let Some(uri) = ix.uri {
        size_diff += (uri.len() as isize)
            .checked_sub(escrow.uri.len() as isize)
            .ok_or(MplHybridError::NumericalOverflow)?;
        escrow.uri = uri;
    }
    if let Some(max) = ix.max {
        escrow.max = max;
    }
    if let Some(min) = ix.min {
        escrow.min = min;
    }
    if let Some(amount) = ix.amount {
        escrow.amount = amount;
    }
    if let Some(fee_amount) = ix.fee_amount {
        escrow.fee_amount = fee_amount;
    }
    if let Some(sol_fee_amount) = ix.sol_fee_amount {
        escrow.sol_fee_amount = sol_fee_amount;
    }
    if let Some(path) = ix.path {
        // We can't allow the path to be set if the escrow has a swap count > 1.
        // Count is set at a starting value of 1 while initializing the escrow so 1 === no swaps.
        if escrow.count > 1 && escrow.path != path {
            return Err(MplHybridError::PathCannotBeSet.into());
        }

        escrow.path = path;
    }

    let new_size = (escrow.to_account_info().data_len() as isize)
        .checked_add(size_diff)
        .ok_or(MplHybridError::NumericalOverflow)?;
    resize_or_reallocate_account_raw(
        &escrow.to_account_info(),
        authority,
        &ctx.accounts.system_program,
        new_size as usize,
    )?;

    Ok(())
}
