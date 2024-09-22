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
}
