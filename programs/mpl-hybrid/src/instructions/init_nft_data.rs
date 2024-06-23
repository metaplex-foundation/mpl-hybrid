use crate::constants::MPL_CORE;
use crate::error::MplHybridError;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use mpl_core::accounts::{BaseAssetV1, BaseCollectionV1};
use mpl_core::load_key;
use mpl_core::types::{Key as MplCoreKey, UpdateAuthority};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitNftDataV1Ix {
    name: String,
    uri: String,
    max: u64,
    min: u64,
    amount: u64,
    fee_amount: u64,
    sol_fee_amount: u64,
    path: u16,
}

#[derive(Accounts)]
pub struct InitNftDataV1Ctx<'info> {
    #[account(
        init, 
        seeds = [
            "nft".as_bytes(), 
            asset.key().as_ref()
            ],
        bump, 
        payer = authority, 
        space = 500
    )]
    nft_data: Account<'info, NftDataV1>,

    #[account(mut)]
    authority: Signer<'info>,

    /// CHECK: We check the asset bellow and with nft data seeds
    asset: UncheckedAccount<'info>,

    /// CHECK: We check the collection bellow
    collection: UncheckedAccount<'info>,

    /// CHECK: This is a user defined account
    token: Account<'info, Mint>,

    /// CHECK: This is a user defined account
    fee_location: UncheckedAccount<'info>,
    system_program: Program<'info, System>,
}

pub fn handler_init_nft_data_v1(ctx: Context<InitNftDataV1Ctx>, ix: InitNftDataV1Ix) -> Result<()> {
    let nft_data = &mut ctx.accounts.nft_data;
    let authority = &mut ctx.accounts.authority;
    let asset = &mut ctx.accounts.asset;
    let collection = &mut ctx.accounts.collection;
    let token = &mut ctx.accounts.token;
    let fee_location = &mut ctx.accounts.fee_location;

    // We can't allow the max to be less than the min.
    if ix.max < ix.min {
        return Err(MplHybridError::MaxMustBeGreaterThanMin.into());
    }

    // Check that a valid asset has been passed in.
    if *asset.owner != MPL_CORE || load_key(&asset.to_account_info(), 0)? != MplCoreKey::AssetV1 {
        return Err(MplHybridError::InvalidAssetAccount.into());
    }

    // We only fetch the Base assets because we only need to check the collection here.
    let asset_data = BaseAssetV1::from_bytes(&asset.to_account_info().data.borrow())?;
    // Check that the collection that the asset is a part of is the one this escrow is configured for.
    if asset_data.update_authority != UpdateAuthority::Collection(collection.key()) {
        return Err(MplHybridError::InvalidCollection.into());
    }

    // Check that a valid collection has been passed in.
    if *collection.owner != MPL_CORE
        || load_key(&collection.to_account_info(), 0)? != MplCoreKey::CollectionV1
    {
        return Err(MplHybridError::InvalidCollectionAccount.into());
    }

    // We only fetch the Base collection to check authority.
    let collection_data =
        BaseCollectionV1::from_bytes(&collection.to_account_info().data.borrow())?;

    // Check that the collection authority is the same as the escrow authority.
    if collection_data.update_authority != authority.key() {
        return Err(MplHybridError::InvalidCollectionAuthority.into());
    }

    //initialize with input data

    nft_data.authority = authority.key();
    nft_data.token = token.key();
    nft_data.fee_location = fee_location.key();
    nft_data.name = ix.name;
    nft_data.uri = ix.uri;
    nft_data.max = ix.max;
    nft_data.min = ix.min;
    nft_data.amount = ix.amount;
    nft_data.fee_amount = ix.fee_amount;
    nft_data.sol_fee_amount = ix.sol_fee_amount;
    nft_data.count = 0;
    nft_data.path = ix.path;
    nft_data.bump = ctx.bumps.nft_data;

    Ok(())
}
