use anchor_lang::prelude::*;
use instructions::*;

declare_id!("MPL4o4wMzndgh8T1NVDxELQCj5UQfYTYEkabX3wNKtb");

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;
pub mod utils;

#[program]
pub mod mpl_hybrid {

    use super::*;

    pub fn init_escrow_v1(ctx: Context<InitEscrowV1Ctx>, ix: InitEscrowV1Ix) -> Result<()> {
        init_escrow::handler_init_escrow_v1(ctx, ix)
    }

    pub fn init_nft_data_v1(ctx: Context<InitNftDataV1Ctx>, ix: InitNftDataV1Ix) -> Result<()> {
        init_nft_data::handler_init_nft_data_v1(ctx, ix)
    }

    pub fn capture_v1(ctx: Context<CaptureV1Ctx>) -> Result<()> {
        capture::handler_capture_v1(ctx)
    }

    pub fn release_v1(ctx: Context<ReleaseV1Ctx>) -> Result<()> {
        release::handler_release_v1(ctx)
    }

    pub fn update_escrow_v1(ctx: Context<UpdateEscrowV1Ctx>, ix: UpdateEscrowV1Ix) -> Result<()> {
        update_escrow::handler_update_escrow_v1(ctx, ix)
    }

    pub fn update_new_data_v1(
        ctx: Context<UpdateNftDataV1Ctx>,
        ix: UpdateNftDataV1Ix,
    ) -> Result<()> {
        update_new_data::handler_update_new_data_v1(ctx, ix)
    }

    pub fn create_recipe_v1(ctx: Context<CreateRecipeV1>, args: CreateRecipeV1Args) -> Result<()> {
        create_recipe::handle_create_recipe_v1(ctx, args)
    }

    pub fn create_checklist_v1(ctx: Context<CreateChecklistV1>) -> Result<()> {
        create_checklist::handle_create_checklist_v1(ctx)
    }

    pub fn deposit_core_asset_v1(
        ctx: Context<DepositCoreAssetV1>,
        args: DepositCoreAssetV1Args,
    ) -> Result<()> {
        deposit_core_asset::handle_deposit_core_asset_v1(ctx, args)
    }

    pub fn deposit_sol_v1(ctx: Context<DepositSolV1>, args: DepositSolV1Args) -> Result<()> {
        deposit_sol::handle_deposit_sol_v1(ctx, args)
    }

    pub fn deposit_spl_token_v1(
        ctx: Context<DepositSplTokenV1>,
        args: DepositSplTokenV1Args,
    ) -> Result<()> {
        deposit_spl_token::handle_deposit_spl_token_v1(ctx, args)
    }

    pub fn withdraw_core_asset_v1(
        ctx: Context<WithdrawCoreAssetV1>,
        args: WithdrawCoreAssetV1Args,
    ) -> Result<()> {
        withdraw_core_asset::handle_withdraw_core_asset_v1(ctx, args)
    }

    pub fn withdraw_sol_v1(ctx: Context<WithdrawSolV1>, args: WithdrawSolV1Args) -> Result<()> {
        withdraw_sol::handle_withdraw_sol_v1(ctx, args)
    }

    pub fn withdraw_spl_token_v1(
        ctx: Context<WithdrawSplTokenV1>,
        args: WithdrawSplTokenV1Args,
    ) -> Result<()> {
        withdraw_spl_token::handle_withdraw_spl_token_v1(ctx, args)
    }
}
