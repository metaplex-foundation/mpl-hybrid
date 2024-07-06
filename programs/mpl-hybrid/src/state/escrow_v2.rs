use anchor_lang::prelude::*;
use anchor_spl::associated_token::get_associated_token_address;
use enum_as_inner::EnumAsInner;

use super::EscrowV1;

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
            IngredientV1::None => None,
            IngredientV1::Sol(_) => None,
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

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct IngredientTriggerPairV1 {
    pub ingredient: IngredientV1,
    pub trigger: TriggerV1,
}

#[account]
pub struct RecipeV1 {
    pub authority: Pubkey,
    pub count: u64,
    pub reversible: bool,
    pub bump: u8,
    pub inputs: Vec<IngredientTriggerPairV1>,
    pub outputs: Vec<IngredientTriggerPairV1>,
}

impl From<EscrowV1> for RecipeV1 {
    fn from(escrow: EscrowV1) -> Self {
        let (escrow_address, _escrow_bump) = Pubkey::find_program_address(
            &["escrow".as_bytes(), escrow.collection.as_ref()],
            &crate::ID,
        );
        let fee_ata = get_associated_token_address(&escrow_address, &escrow.token);
        Self {
            authority: escrow.authority,
            count: escrow.count,
            reversible: true,
            bump: escrow.bump,
            inputs: vec![
                IngredientTriggerPairV1 {
                    ingredient: IngredientV1::CoreCollection(escrow.collection),
                    trigger: TriggerV1::SolFee {
                        amount: escrow.sol_fee_amount,
                        fee_account: escrow.fee_location,
                    },
                },
                IngredientTriggerPairV1 {
                    ingredient: IngredientV1::None,
                    trigger: TriggerV1::TokenFee {
                        amount: escrow.fee_amount,
                        fee_account: escrow.fee_location,
                        fee_token_account: fee_ata,
                    },
                },
            ],
            outputs: vec![IngredientTriggerPairV1 {
                ingredient: IngredientV1::SplToken(escrow.token, escrow.amount),
                trigger: TriggerV1::None,
            }],
        }
    }
}

impl RecipeV1 {
    pub fn get_input_keys(&self) -> Vec<&[u8]> {
        self.inputs
            .iter()
            .filter_map(
                |IngredientTriggerPairV1 {
                     ingredient,
                     trigger: _,
                 }| ingredient.get_key_seed(),
            )
            .collect()
    }
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct CheckPairV1 {
    pub ingredient_checked: bool,
    pub trigger_checked: bool,
}

#[account]
pub struct RecipeChecklistV1 {
    pub bump: u8,
    pub inputs: Vec<CheckPairV1>,
    pub outputs: Vec<CheckPairV1>,
}

impl RecipeChecklistV1 {
    pub const BASE_LEN: usize = 8 + 1 + 4 + 4;

    pub fn get_size(&self) -> usize {
        8 + 1 + 4 + 2 * self.inputs.len() + 4 + 2 * self.outputs.len()
    }
}
