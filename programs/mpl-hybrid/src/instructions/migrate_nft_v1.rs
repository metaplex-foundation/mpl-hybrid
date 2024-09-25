use crate::error::MplHybridError;
use crate::state::*;
use crate::{constants::*};
use anchor_lang::{
    accounts::{program::Program, signer::Signer, unchecked_account::UncheckedAccount},
    system_program::System,
};
use anchor_lang::{prelude::*};
use mpl_core::instructions::{
    TransferV1Cpi, TransferV1InstructionArgs
};

#[derive(Accounts)]
pub struct MigrateNftV1Ctx<'info> {
    #[account(mut)]
    authority: Signer<'info>,

    #[account(
        mut,
        seeds = [
            "escrow".as_bytes(), 
            authority.key().as_ref()
            ],
        bump=escrow_new.bump,
    )]
    escrow_new: Account<'info, EscrowV2>,

    #[account(
        mut,
        seeds = [
            "escrow".as_bytes(), 
            collection.key().as_ref()
            ],
        bump=escrow_old.bump,
    )]
    escrow_old: Account<'info, EscrowV1>,

    /// CHECK: We check the asset bellow
    #[account(mut)]
    asset: UncheckedAccount<'info>,

    /// CHECK: We check against escrow
    #[account(mut,
        address = escrow_old.collection
    )]
    collection: AccountInfo<'info>,
    /// CHECK: We check against constant
    #[account(
        address = MPL_CORE @ MplHybridError::InvalidMplCore
    )]
    mpl_core: AccountInfo<'info>,
    system_program: Program<'info, System>
}

pub fn handler_migrate_nft_v1(ctx: Context<MigrateNftV1Ctx>) -> Result<()> {

    let authority = &mut ctx.accounts.authority;
    let escrow_new = &mut ctx.accounts.escrow_new;
    let escrow_old = &mut ctx.accounts.escrow_old;
    let collection = &mut ctx.accounts.collection;
    let asset = &mut ctx.accounts.asset;
    let mpl_core = &mut ctx.accounts.mpl_core;
    let system_program = &mut ctx.accounts.system_program;
    
    let system_info = &system_program.to_account_info();

    let collection_info = &collection.to_account_info();
    let escrow_info = &escrow_old.to_account_info(); 

    //create transfer instruction
    let transfer_nft_ix = TransferV1Cpi {
        __program: &mpl_core.to_account_info(),
        asset: &asset.to_account_info(),
        collection: Some(collection_info),
        payer: &authority.to_account_info(),
        authority: Some(escrow_info),
        new_owner: &escrow_new.to_account_info(),
        system_program: Some(system_info),
        log_wrapper: None,
        __args: TransferV1InstructionArgs {
            compression_proof: None,
        },
    };

    //invoke the transfer instruction with seeds
    let _transfer_nft_result =
        transfer_nft_ix.invoke_signed(&[&[b"escrow", collection.key.as_ref(), &[escrow_old.bump]]]);

    Ok(())
}
