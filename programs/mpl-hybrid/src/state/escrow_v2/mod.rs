pub mod checklist;
pub mod ingredient;
pub mod recipe;
pub mod trigger;

pub use checklist::*;
pub use ingredient::*;
pub use recipe::*;
pub use trigger::*;

use anchor_lang::prelude::*;

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct IngredientTriggerPairV1 {
    pub ingredient: IngredientV1,
    pub trigger: TriggerV1,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct CheckPairV1 {
    pub ingredient_checked: bool,
    pub trigger_checked: bool,
}
