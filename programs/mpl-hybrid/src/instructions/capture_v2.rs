use crate::error::MplHybridError;
use crate::state::*;
use crate::utils::validate_token_account;
use crate::{constants::*, utils::create_associated_token_account};
use anchor_lang::{
    accounts::{program::Program, signer::Signer, unchecked_account::UncheckedAccount},
    system_program::System,
};
use anchor_lang::{prelude::*, system_program};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Mint;
use anchor_spl::token::{self, Burn};
use anchor_spl::token::{Token, Transfer};
use arrayref::array_ref;
use mpl_core::accounts::BaseAssetV1;
use mpl_core::instructions::{
    TransferV1Cpi, TransferV1InstructionArgs, UpdateV1Cpi, UpdateV1InstructionArgs,
};
use mpl_core::types::UpdateAuthority;
use mpl_utils::assert_signer;
use solana_program::program::invoke;

#[derive(Accounts)]
pub struct CaptureV2Ctx<'info> {
    #[account(mut)]
    owner: Signer<'info>,

    /// CHECK: Optional signer, which we check in the handler.
    #[account(mut)]
    authority: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [
            "recipe".as_bytes(), 
            collection.key().as_ref()
            ],
        bump=recipe.bump
    )]
    recipe: Box<Account<'info, RecipeV1>>,

    #[account(
        mut,
        seeds = [
            "escrow".as_bytes(), 
            recipe.authority.as_ref()
            ],
        bump=escrow.bump,
    )]
    escrow: Box<Account<'info, EscrowV2>>,

    /// CHECK: We check the asset bellow
    #[account(mut)]
    asset: UncheckedAccount<'info>,

    /// CHECK: We check against escrow
    #[account(mut,
        address = recipe.collection
    )]
    collection: AccountInfo<'info>,

    /// CHECK: We check and initialize the token account below.
    #[account(mut)]
    user_token_account: AccountInfo<'info>,

    /// CHECK: We check and initialize the token account below.
    #[account(mut)]
    escrow_token_account: AccountInfo<'info>,

    /// CHECK: This is a user defined account
    #[account(
        address = recipe.token @MplHybridError::InvalidMintAccount
    )]
    token: Account<'info, Mint>,

    /// CHECK: We check and initialize the token account below.
    #[account(mut)]
    fee_token_account: AccountInfo<'info>,

    /// CHECK: We check against constant
    #[account(mut,
        address = FEE_WALLET @ MplHybridError::InvalidConstantFeeWallet
    )]
    fee_sol_account: AccountInfo<'info>,

    /// CHECK: We check against recipe
    #[account(mut,
        address = recipe.fee_location @ MplHybridError::InvalidProjectFeeWallet
    )]
    fee_project_account: AccountInfo<'info>,

    /// CHECK: We check against constant
    #[account(
        address = SLOT_HASHES  @ MplHybridError::InvalidSlotHash
    )]
    recent_blockhashes: AccountInfo<'info>,

    /// CHECK: We check against constant
    #[account(
        address = MPL_CORE @ MplHybridError::InvalidMplCore
    )]
    mpl_core: AccountInfo<'info>,

    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handler_capture_v2(ctx: Context<CaptureV2Ctx>) -> Result<()> {
    let owner = &mut ctx.accounts.owner;
    let escrow = &mut ctx.accounts.escrow;
    let recipe = &mut ctx.accounts.recipe;
    let asset = &mut ctx.accounts.asset;
    let authority = &mut ctx.accounts.authority;
    let collection = &mut ctx.accounts.collection;
    let mpl_core = &mut ctx.accounts.mpl_core;
    let user_token_account = &mut ctx.accounts.user_token_account;
    let escrow_token_account = &mut ctx.accounts.escrow_token_account;
    let fee_token_account = &mut ctx.accounts.fee_token_account;
    let fee_sol_account = &mut ctx.accounts.fee_sol_account;
    let fee_project_account = &mut ctx.accounts.fee_project_account;
    let system_program = &mut ctx.accounts.system_program;
    let token_program = &mut ctx.accounts.token_program;

    let collection_info = &collection.to_account_info();
    let authority_info = &authority.to_account_info();
    let escrow_info = &escrow.to_account_info();
    let system_info = &system_program.to_account_info();

    if recipe.authority != escrow.authority {
        return Err(MplHybridError::InvalidAuthority.into());
    }

    if Path::BlockCapture.check(recipe.path) {
        return Err(MplHybridError::CaptureBlocked.into());
    }

    // The user token account should already exist.
    validate_token_account(user_token_account, &owner.key(), &ctx.accounts.token.key())?;

    if escrow_token_account.owner == &system_program::ID {
        create_associated_token_account(
            owner,
            &escrow.to_account_info(),
            &ctx.accounts.token.to_account_info(),
            escrow_token_account,
            token_program,
            system_program,
        )?;
    } else {
        validate_token_account(
            escrow_token_account,
            &escrow.key(),
            &ctx.accounts.token.key(),
        )?;
    }

    if fee_token_account.owner == &system_program::ID {
        create_associated_token_account(
            owner,
            &fee_project_account.to_account_info(),
            &ctx.accounts.token.to_account_info(),
            fee_token_account,
            token_program,
            system_program,
        )?;
    } else {
        validate_token_account(
            fee_token_account,
            &fee_project_account.key(),
            &ctx.accounts.token.key(),
        )?;
    }

    // We only fetch the Base assets because we only need to check the collection here.
    let asset_data = BaseAssetV1::from_bytes(&asset.to_account_info().data.borrow())?;
    // Check that the collection that the asset is a part of is the one this recipe is configured for.
    if asset_data.update_authority != UpdateAuthority::Collection(recipe.collection) {
        return Err(MplHybridError::InvalidCollection.into());
    }

    if authority_info.key == &recipe.authority {
        assert_signer(authority)?;
    }

    //If the path has bit 0 unset, we need to update the metadata onchain
    if !Path::NoRerollMetadata.check(recipe.path) {
        let clock = Clock::get()?;
        // seed for the random number is a combination of the slot_hash - timestamp
        let recent_slothashes = &ctx.accounts.recent_blockhashes;
        let data = recent_slothashes.data.borrow();
        let most_recent = array_ref![data, 12, 8];

        let seed = u64::from_le_bytes(*most_recent)
            .saturating_sub(clock.unix_timestamp as u64)
            .wrapping_mul(recipe.count);

        // remainder is the random number between the min and max
        let remainder = seed
            .checked_rem(recipe.max - recipe.min)
            .ok_or(MplHybridError::RandomnessError)?
            + recipe.min;

        //construct the new uri
        let mut uri = recipe.uri.clone();
        let name = recipe.name.clone();
        let json_extension = ".json".to_string();

        uri.push_str(&remainder.to_string());
        uri.push_str(&json_extension);

        //create update instruction
        let update_ix = UpdateV1Cpi {
            __program: &mpl_core.to_account_info(),
            asset: &asset.to_account_info(),
            collection: Some(collection_info),
            payer: &owner.to_account_info(),
            authority: Some(authority_info),
            system_program: &system_program.to_account_info(),
            log_wrapper: None,
            __args: UpdateV1InstructionArgs {
                new_name: Some(name),
                new_uri: Some(uri),
                new_update_authority: None,
            },
        };

        if authority_info.key == &recipe.authority {
            //invoke the update instruction
            update_ix.invoke()?;
        } else if authority_info.key == &recipe.key() {
            // The auth has been delegated as the UpdateDelegate on the asset.
            update_ix.invoke_signed(&[&[b"recipe", collection.key.as_ref(), &[recipe.bump]]])?;
        } else {
            return Err(MplHybridError::InvalidUpdateAuthority.into());
        }
    }

    //create transfer instruction
    let transfer_nft_ix = TransferV1Cpi {
        __program: &mpl_core.to_account_info(),
        asset: &asset.to_account_info(),
        collection: Some(collection_info),
        payer: &owner.to_account_info(),
        authority: Some(escrow_info),
        new_owner: &owner.to_account_info(),
        system_program: Some(system_info),
        log_wrapper: None,
        __args: TransferV1InstructionArgs {
            compression_proof: None,
        },
    };

    //invoke the transfer instruction with seeds
    transfer_nft_ix.invoke_signed(&[&[b"escrow", recipe.authority.as_ref(), &[escrow.bump]]])?;

    let cpi_program = token_program.to_account_info();

    // If the path has burn on capture, we burn the token
    if Path::BurnOnCapture.check(recipe.path) {
        //create burn instruction
        let cpi_accounts_burn = Burn {
            mint: ctx.accounts.token.to_account_info(),
            from: user_token_account.to_account_info(),
            authority: owner.to_account_info(),
        };

        let burn_cpi_ctx = CpiContext::new(cpi_program.clone(), cpi_accounts_burn);

        token::burn(burn_cpi_ctx, recipe.amount)?;
    }
    // Otherwise, we transfer the token to the escrow
    else {
        //create transfer token instruction
        let cpi_accounts_transfer = Transfer {
            from: user_token_account.to_account_info(),
            to: escrow_token_account.to_account_info(),
            authority: owner.to_account_info(),
        };

        let transfer_cpi_ctx = CpiContext::new(cpi_program.clone(), cpi_accounts_transfer);

        token::transfer(transfer_cpi_ctx, recipe.amount)?;
    }

    //create transfer fee token instruction
    let cpi_accounts_fee_transfer = Transfer {
        from: user_token_account.to_account_info(),
        to: fee_token_account.to_account_info(),
        authority: owner.to_account_info(),
    };

    let transfer_fees_cpi_ctx = CpiContext::new(cpi_program.clone(), cpi_accounts_fee_transfer);

    token::transfer(transfer_fees_cpi_ctx, recipe.fee_amount_capture)?;

    //create protocol transfer fee sol instruction
    let sol_fee_ix = anchor_lang::solana_program::system_instruction::transfer(
        &owner.key(),
        &fee_sol_account.key(),
        get_protocol_fee()?,
    );

    //invoke protocol the transfer fee sol instruction
    invoke(
        &sol_fee_ix,
        &[owner.to_account_info(), fee_sol_account.to_account_info()],
    )?;

    //create project transfer fee sol instruction for project
    let sol_fee_project_ix = anchor_lang::solana_program::system_instruction::transfer(
        &owner.key(),
        &fee_project_account.key(),
        recipe.sol_fee_amount_capture,
    );

    //invoke project the transfer fee sol instruction for project
    invoke(
        &sol_fee_project_ix,
        &[
            owner.to_account_info(),
            fee_project_account.to_account_info(),
        ],
    )?;

    //increment the swap count
    recipe.count += 1;

    Ok(())
}
