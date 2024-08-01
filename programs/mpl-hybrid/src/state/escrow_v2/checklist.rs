use anchor_lang::prelude::*;

use super::CheckPairV1;

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
