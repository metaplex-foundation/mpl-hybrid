use anchor_lang::prelude::*;

#[error_code]
pub enum MplHybridError {
    #[msg("Invalid Collection")]
    InvalidCollection,
    #[msg("Collection Authority does not match signer")]
    InvalidCollectionAuthority,
    #[msg("Error in the randomness")]
    RandomnessError,
    #[msg("Invalid Fee Constant Wallet")]
    InvalidConstantFeeWallet,
    #[msg("Invalid Project Fee Wallet")]
    InvalidProjectFeeWallet,
    #[msg("Invalid SlotHash Program Account")]
    InvalidSlotHash,
    #[msg("Invalid MPL CORE Program Account")]
    InvalidMplCore,
    #[msg("Invalid Collection Account")]
    InvalidCollectionAccount,
    #[msg("Invalid Asset Account")]
    InvalidAssetAccount,
    #[msg("Max must be greater than Min")]
    MaxMustBeGreaterThanMin,
    #[msg("Invalid Mint Account")]
    InvalidMintAccount,
    #[msg("Numerical Overflow")]
    NumericalOverflow,
    #[msg("Not a valid Ingredient")]
    InvalidIngredient,
    #[msg("Missing Input Deposit")]
    MissingInputDeposit,
}
