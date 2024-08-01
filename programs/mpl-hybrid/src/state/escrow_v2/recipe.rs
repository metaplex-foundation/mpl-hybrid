use anchor_lang::prelude::*;
use anchor_spl::associated_token::get_associated_token_address;

use crate::state::{EscrowV1, TriggerV1};

use super::{IngredientTriggerPairV1, IngredientV1};

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
