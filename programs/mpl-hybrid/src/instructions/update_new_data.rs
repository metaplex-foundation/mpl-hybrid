use crate::error::MplHybridError;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use mpl_core::accounts::{BaseAssetV1, BaseCollectionV1};
use mpl_core::types::UpdateAuthority;
use mpl_utils::resize_or_reallocate_account_raw;

//need to add options
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateNftDataV1Ix {
    name: Option<String>,
    uri: Option<String>,
    max: Option<u64>,
    min: Option<u64>,
    amount: Option<u64>,
    fee_amount: Option<u64>,
    sol_fee_amount: Option<u64>,
    path: Option<u16>,
}

#[derive(Accounts)]
pub struct UpdateNftDataV1Ctx<'info> {
    #[account(
        mut,
        seeds = [
            "nft".as_bytes(), 
            asset.key().as_ref()
            ],
        bump = nft_data.bump
    )]
    nft_data: Account<'info, NftDataV1>,

    #[account(mut)]
    authority: Signer<'info>,

    /// CHECK: We check bellow
    collection: UncheckedAccount<'info>,

    /// CHECK: We check bellow and with nft data seeds
    asset: UncheckedAccount<'info>,

    /// CHECK: This is a user defined account
    token: Account<'info, Mint>,

    /// CHECK: This is a user defined account
    fee_location: UncheckedAccount<'info>,
    system_program: Program<'info, System>,
}

pub fn handler_update_new_data_v1(
    ctx: Context<UpdateNftDataV1Ctx>,
    ix: UpdateNftDataV1Ix,
) -> Result<()> {
    let nft_data = &mut ctx.accounts.nft_data;
    let authority = &mut ctx.accounts.authority;
    let asset = &mut ctx.accounts.asset;
    let collection = &mut ctx.accounts.collection;
    let token = &mut ctx.accounts.token;
    let fee_location = &mut ctx.accounts.fee_location;

    // We only fetch the Base assets because we only need to check the collection here.
    let asset_data = BaseAssetV1::from_bytes(&asset.to_account_info().data.borrow())?;
    // Check that the collection that the asset is a part of.
    if asset_data.update_authority != UpdateAuthority::Collection(collection.key()) {
        return Err(MplHybridError::InvalidCollection.into());
    }

    // We only fetch the Base collection to check authority.
    let collection_data =
        BaseCollectionV1::from_bytes(&collection.to_account_info().data.borrow())?;

    // Check that the collection authority is the same as the escrow authority.
    if collection_data.update_authority != authority.key() {
        return Err(MplHybridError::InvalidCollectionAuthority.into());
    }

    let mut size_diff: isize = 0;
    nft_data.authority = authority.key();
    nft_data.token = token.key();
    nft_data.fee_location = fee_location.key();
    if let Some(name) = ix.name {
        size_diff += name
            .len()
            .checked_sub(nft_data.name.len())
            .ok_or(MplHybridError::NumericalOverflow)? as isize;
        nft_data.name = name;
    }
    if let Some(uri) = ix.uri {
        size_diff += uri
            .len()
            .checked_sub(nft_data.uri.len())
            .ok_or(MplHybridError::NumericalOverflow)? as isize;
        nft_data.uri = uri;
    }
    if let Some(max) = ix.max {
        nft_data.max = max;
    }
    if let Some(min) = ix.min {
        nft_data.min = min;
    }
    if let Some(amount) = ix.amount {
        nft_data.amount = amount;
    }
    if let Some(fee_amount) = ix.fee_amount {
        nft_data.fee_amount = fee_amount;
    }
    if let Some(sol_fee_amount) = ix.sol_fee_amount {
        nft_data.sol_fee_amount = sol_fee_amount;
    }
    if let Some(path) = ix.path {
        nft_data.path = path;
    }

    let new_size = nft_data
        .to_account_info()
        .data_len()
        .checked_add(size_diff as usize)
        .ok_or(MplHybridError::NumericalOverflow)?;
    resize_or_reallocate_account_raw(
        &nft_data.to_account_info(),
        authority,
        &ctx.accounts.system_program,
        new_size,
    )?;

    Ok(())
}
