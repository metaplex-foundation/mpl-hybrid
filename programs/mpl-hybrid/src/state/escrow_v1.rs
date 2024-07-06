use anchor_lang::prelude::*;

#[account]
pub struct EscrowV1 {
    //32 the collection account
    pub collection: Pubkey,
    //32 the escrow authority (must match collection authority)
    pub authority: Pubkey,
    //32 the token to be dispensed
    pub token: Pubkey,
    //32 the account to send token fees to
    pub fee_location: Pubkey,
    //4 the NFT name
    pub name: String,
    //4 the base uri for the NFT metadata
    pub uri: String,
    //8 the max index of NFTs that append to the uri
    pub max: u64,
    //8 the minimum index of NFTs that append to the uri
    pub min: u64,
    //8 the token cost to swap
    pub amount: u64,
    //8 the token fee for capturing the NFT
    pub fee_amount: u64,
    //8 the sol fee for capturing the NFT
    pub sol_fee_amount: u64,
    //8 the total number of swaps
    pub count: u64,
    //1 onchain/offchain metadata update path
    pub path: u16,
    //1 escrow bump
    pub bump: u8,
}

impl EscrowV1 {
    pub const BASE_ESCROW_SIZE: usize =
        8 + 32 + 32 + 32 + 32 + 4 + 4 + 8 + 8 + 8 + 8 + 8 + 8 + 2 + 1;
}
