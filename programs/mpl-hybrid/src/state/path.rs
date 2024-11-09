use anchor_lang::prelude::*;

#[derive(Debug, Clone, PartialEq, Eq, AnchorSerialize, AnchorDeserialize)]
pub enum Path {
    RerollMetadata,
}

impl Path {
    pub fn check(self, bits: u16) -> bool {
        bits & (1 << (self as u16)) == 0
    }
}
