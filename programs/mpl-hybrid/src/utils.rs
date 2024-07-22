use crate::{error::MplHybridError, state::CheckPairV1};
use anchor_lang::prelude::*;

pub fn assert_deposits_finished(inputs: &[CheckPairV1]) -> Result<()> {
    for CheckPairV1 {
        ingredient_checked, ..
    } in inputs
    {
        if !ingredient_checked {
            return Err(MplHybridError::MissingInputDeposit.into());
        }
    }
    Ok(())
}
