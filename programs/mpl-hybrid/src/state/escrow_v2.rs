use anchor_lang::prelude::*;

#[account]
pub struct EscrowV2 {
    //32 the escrow authority
    pub authority: Pubkey,
    //1 escrow V2 bump
    pub bump: u8,
}

impl EscrowV2 {
    pub const BASE_ESCROW_V2_SIZE: usize = 8 + 32 + 1;
}
