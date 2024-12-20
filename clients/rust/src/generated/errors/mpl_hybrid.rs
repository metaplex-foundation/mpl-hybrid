//! This code was AUTOGENERATED using the kinobi library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun kinobi to update it.
//!
//! [https://github.com/metaplex-foundation/kinobi]
//!

use num_derive::FromPrimitive;
use thiserror::Error;

#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum MplHybridError {
    /// 6000 (0x1770) - Invalid Collection
    #[error("Invalid Collection")]
    InvalidCollection,
    /// 6001 (0x1771) - Collection Authority does not match signer
    #[error("Collection Authority does not match signer")]
    InvalidCollectionAuthority,
    /// 6002 (0x1772) - Error in the randomness
    #[error("Error in the randomness")]
    RandomnessError,
    /// 6003 (0x1773) - Invalid Fee Constant Wallet
    #[error("Invalid Fee Constant Wallet")]
    InvalidConstantFeeWallet,
    /// 6004 (0x1774) - Invalid Project Fee Wallet
    #[error("Invalid Project Fee Wallet")]
    InvalidProjectFeeWallet,
    /// 6005 (0x1775) - Invalid SlotHash Program Account
    #[error("Invalid SlotHash Program Account")]
    InvalidSlotHash,
    /// 6006 (0x1776) - Invalid MPL CORE Program Account
    #[error("Invalid MPL CORE Program Account")]
    InvalidMplCore,
    /// 6007 (0x1777) - Invalid Collection Account
    #[error("Invalid Collection Account")]
    InvalidCollectionAccount,
    /// 6008 (0x1778) - Invalid Asset Account
    #[error("Invalid Asset Account")]
    InvalidAssetAccount,
    /// 6009 (0x1779) - Max must be greater than Min
    #[error("Max must be greater than Min")]
    MaxMustBeGreaterThanMin,
    /// 6010 (0x177A) - Invalid Mint Account
    #[error("Invalid Mint Account")]
    InvalidMintAccount,
    /// 6011 (0x177B) - Numerical Overflow
    #[error("Numerical Overflow")]
    NumericalOverflow,
    /// 6012 (0x177C) - Invalid Update Authority
    #[error("Invalid Update Authority")]
    InvalidUpdateAuthority,
    /// 6013 (0x177D) - Invalid Token Account
    #[error("Invalid Token Account")]
    InvalidTokenAccount,
    /// 6014 (0x177E) - Invalid Token Account Owner
    #[error("Invalid Token Account Owner")]
    InvalidTokenAccountOwner,
    /// 6015 (0x177F) - Invalid Token Account Mint
    #[error("Invalid Token Account Mint")]
    InvalidTokenAccountMint,
    /// 6016 (0x1780) - Invalid Authorities
    #[error("Invalid Authorities")]
    InvalidAuthority,
    /// 6017 (0x1781) - Path can not be set
    #[error("Path can not be set")]
    PathCannotBeSet,
}

impl solana_program::program_error::PrintProgramError for MplHybridError {
    fn print<E>(&self) {
        solana_program::msg!(&self.to_string());
    }
}
