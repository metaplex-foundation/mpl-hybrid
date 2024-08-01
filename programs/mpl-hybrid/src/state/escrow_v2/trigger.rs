use anchor_lang::prelude::*;
use enum_as_inner::EnumAsInner;

#[derive(AnchorDeserialize, AnchorSerialize, Clone, EnumAsInner)]
pub enum TriggerV1 {
    None,
    Rename {
        // The NFT name.
        name: String,
        // The base uri for the NFT metadata.
        uri: String,
        // The max index of NFTs that append to the uri.
        max: u32,
        // The minimum index of NFTs that append to the uri.
        min: u32,
    },
    SolFee {
        // The amount of SOL to send to the fee account.
        amount: u64,
        // The fee account.
        fee_account: Pubkey,
    },
    TokenFee {
        // The amount of tokens to send to the fee account.
        amount: u64,
        // The fee account.
        fee_account: Pubkey,
        // The fee token account.
        fee_token_account: Pubkey,
    },
}
