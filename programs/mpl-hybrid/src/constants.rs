use anchor_lang::prelude::*;
use solana_program::{pubkey, pubkey::Pubkey};

pub const FEE_WALLET_V1: Pubkey = pubkey!("GjF4LqmEhV33riVyAwHwiEeAHx4XXFn2yMY3fmMigoP3");
pub const FEE_WALLET_V2: Pubkey = pubkey!("C3iyKknpNPeZXQEVLkR8ZJxcgB8xdsqXkyrV1RwEmdrD");
pub const SLOT_HASHES: Pubkey = pubkey!("SysvarS1otHashes111111111111111111111111111");
pub const MPL_CORE: Pubkey = pubkey!("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

/// Protocol fee in lamports charged on capture and release (0.005 SOL).
///
/// This was previously derived from the rent-exempt minimum for 590 bytes plus
/// a 2,720 lamport offset, which evaluates to exactly 5,000,000 lamports under
/// the default rent parameters. It is now a fixed constant so the fee no longer
/// depends on the network's rent configuration.
pub const PROTOCOL_FEE: u64 = 5_000_000;
