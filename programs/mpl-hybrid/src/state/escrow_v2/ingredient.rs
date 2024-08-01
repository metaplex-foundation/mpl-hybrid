use anchor_lang::prelude::*;
use enum_as_inner::EnumAsInner;

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Copy, EnumAsInner)]
pub enum IngredientV1 {
    None,
    Sol(u64),
    CoreAsset(Pubkey),
    CoreCollection(Pubkey),
    SplToken(Pubkey, u64),
    SplToken22(Pubkey, u64),
    TmNft(Pubkey),
    TmNftCollection(Pubkey),
    TmPNft(Pubkey),
    TmPNftCollection(Pubkey),
    CompressedNft(Pubkey),
    CompressedNftCollection(Pubkey),
}

impl IngredientV1 {
    pub fn get_key_seed(&self) -> Option<&[u8]> {
        match self {
            IngredientV1::None => Some("none".as_bytes()),
            IngredientV1::Sol(_) => Some("sol".as_bytes()),
            IngredientV1::CoreAsset(key) => Some(key.as_ref()),
            IngredientV1::CoreCollection(key) => Some(key.as_ref()),
            IngredientV1::SplToken(key, _) => Some(key.as_ref()),
            IngredientV1::SplToken22(key, _) => Some(key.as_ref()),
            IngredientV1::TmNft(key) => Some(key.as_ref()),
            IngredientV1::TmNftCollection(key) => Some(key.as_ref()),
            IngredientV1::TmPNft(key) => Some(key.as_ref()),
            IngredientV1::TmPNftCollection(key) => Some(key.as_ref()),
            IngredientV1::CompressedNft(key) => Some(key.as_ref()),
            IngredientV1::CompressedNftCollection(key) => Some(key.as_ref()),
        }
    }
}
