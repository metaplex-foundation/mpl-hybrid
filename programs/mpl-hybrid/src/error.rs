use anchor_lang::prelude::*;

#[error_code]
pub enum MplHybridError {
    /// 6000 (0x1770) - Invalid Collection
    #[msg("Invalid Collection")]
    InvalidCollection,

    /// 6001 (0x1771) - Collection Authority does not match signer
    #[msg("Collection Authority does not match signer")]
    InvalidCollectionAuthority,

    /// 6002 (0x1772) - Error in the randomness
    #[msg("Error in the randomness")]
    RandomnessError,

    /// 6003 (0x1773) - Invalid Fee Constant Wallet
    #[msg("Invalid Fee Constant Wallet")]
    InvalidConstantFeeWallet,

    /// 6004 (0x1774) - Invalid Project Fee Wallet
    #[msg("Invalid Project Fee Wallet")]
    InvalidProjectFeeWallet,

    /// 6005 (0x1775) - Invalid SlotHash Program Account
    #[msg("Invalid SlotHash Program Account")]
    InvalidSlotHash,

    /// 6006 (0x1776) - Invalid MPL CORE Program Account
    #[msg("Invalid MPL CORE Program Account")]
    InvalidMplCore,

    /// 6007 (0x1777) - Invalid Collection Account
    #[msg("Invalid Collection Account")]
    InvalidCollectionAccount,

    /// 6008 (0x1778) - Invalid Asset Account
    #[msg("Invalid Asset Account")]
    InvalidAssetAccount,

    /// 6009 (0x1779) - Max must be greater than Min
    #[msg("Max must be greater than Min")]
    MaxMustBeGreaterThanMin,

    /// 6010 (0x177A) - Invalid Mint Account
    #[msg("Invalid Mint Account")]
    InvalidMintAccount,

    /// 6011 (0x177B) - Numerical Overflow
    #[msg("Numerical Overflow")]
    NumericalOverflow,

    /// 6012 (0x177C) - Invalid Update Authority
    #[msg("Invalid Update Authority")]
    InvalidUpdateAuthority,

    /// 6013 (0x177D) - Invalid Token Account
    #[msg("Invalid Token Account")]
    InvalidTokenAccount,

    /// 6014 (0x177E) - Invalid Token Account Owner
    #[msg("Invalid Token Account Owner")]
    InvalidTokenAccountOwner,

    /// 6015 (0x177F) - Invalid Token Account Mint
    #[msg("Invalid Token Account Mint")]
    InvalidTokenAccountMint,

    /// 6016 (0x1780) - Invalid Token Account Mint
    #[msg("Invalid Authorities")]
    InvalidAuthority,
}
