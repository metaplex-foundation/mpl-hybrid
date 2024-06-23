use crate::state::*;
use crate::error::MplHybridError;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use mpl_core::accounts::BaseCollectionV1;

//need to add options
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateEscrowV1Ix {
    name: String, 
    uri: String, 
    max: u64,
    min: u64,
    amount: u64,
    fee_amount: u64,
    sol_fee_amount: u64,
    path: u16,
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
        bump=escrow.bump
    )]
    escrow: Account<'info, EscrowV1>,

    #[account(mut)]
    authority: Signer<'info>,

    /// CHECK: We check against escrow
    #[account(mut,
        address = escrow.collection
    )]
    collection:  AccountInfo<'info>,

    /// CHECK: This is a user defined account
    token:  Account<'info, Mint>,
    
    /// CHECK: This is a user defined account
    fee_location:  UncheckedAccount<'info>,
    system_program: Program<'info, System>
}

pub fn handler_update_escrow_v1(ctx: Context<UpdateEscrowV1Ctx>, ix:UpdateEscrowV1Ix) -> Result<()> {
    
    //Need to add account checks for security

    let escrow = &mut ctx.accounts.escrow;
    let collection = &mut ctx.accounts.collection;
    let authority = &mut ctx.accounts.authority;
    let token = &mut ctx.accounts.token;
    let fee_location = &mut ctx.accounts.fee_location;

    // We only fetch the Base collection to check authority.
    let collection_data = BaseCollectionV1::from_bytes(&collection.to_account_info().data.borrow())?;

    // Check that the collection authority is the same as the escrow authority.
    if collection_data.update_authority != authority.key() {
        return Err(MplHybridError::InvalidCollectionAuthority.into());
    }

    //update every thing not optimal
    
    escrow.authority=authority.key();
    escrow.token=token.key();
    escrow.fee_location = fee_location.key();
    escrow.name=ix.name;
    escrow.uri=ix.uri;
    escrow.max=ix.max;
    escrow.min=ix.min;
    escrow.amount=ix.amount;
    escrow.fee_amount=ix.fee_amount;
    escrow.sol_fee_amount=ix.sol_fee_amount;
    escrow.path=ix.path;

    Ok(())
}

