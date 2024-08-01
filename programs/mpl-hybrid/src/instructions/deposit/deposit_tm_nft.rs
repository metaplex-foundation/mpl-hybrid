use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};
use mpl_token_metadata::{
    accounts::Metadata,
    instructions::{TransferV1Cpi, TransferV1InstructionArgs},
};
use mpl_utils::assert_derivation_with_bump;
use solana_program::sysvar::SysvarId;

use crate::{
    error::MplHybridError,
    state::{IngredientTriggerPairV1, IngredientV1, RecipeChecklistV1, RecipeV1},
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct DepositTmNftV1Args {
    pub reversed: bool,
}

#[derive(Accounts)]
pub struct DepositTmNftV1<'info> {
    /// CHECK: The PDA derivation is checked in the handler.
    #[account(mut)]
    pub recipe: Account<'info, RecipeV1>,

    #[account(
        mut,
        seeds = [
            "checklist".as_bytes(),
            recipe.key().as_ref(),
            payer.key().as_ref(),
        ],
        bump=checklist.bump,
    )]
    pub checklist: Account<'info, RecipeChecklistV1>,

    #[account(mut,
        associated_token::mint = mint,
        associated_token::authority = payer
    )]
    pub user_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = recipe
    )]
    pub recipe_token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: This account is checked in the handler.
    pub mint: InterfaceAccount<'info, Mint>,

    /// CHECK: This account is checked in the handler.
    pub metadata: AccountInfo<'info>,

    /// CHECK: This account is checked in the handler.
    pub edition: AccountInfo<'info>,

    /// CHECK: We check the collection in the handler.
    pub collection: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: We check against constant
    #[account(
        address = mpl_token_metadata::ID @ MplHybridError::InvalidTokenMetadataProgram
    )]
    pub mpl_token_metadata: AccountInfo<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(address = Instructions::id() @ MplHybridError::InvalidInstructionsSysvarAddress)]
    pub sysvar_instructions: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositTmPNftV1<'info> {
    /// CHECK: The PDA derivation is checked in the handler.
    #[account(mut)]
    pub recipe: Account<'info, RecipeV1>,

    #[account(
        mut,
        seeds = [
            "checklist".as_bytes(),
            recipe.key().as_ref(),
            payer.key().as_ref(),
        ],
        bump=checklist.bump,
    )]
    pub checklist: Account<'info, RecipeChecklistV1>,

    #[account(mut,
        associated_token::mint = mint,
        associated_token::authority = payer
    )]
    pub user_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = recipe
    )]
    pub recipe_token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: This account is checked in the handler.
    pub mint: InterfaceAccount<'info, Mint>,

    /// CHECK: This account is checked in the handler.
    pub metadata: AccountInfo<'info>,

    /// CHECK: This account is checked in the handler.
    pub edition: AccountInfo<'info>,

    /// CHECK: We check the collection in the handler.
    pub collection: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: We check against constant
    #[account(
        address = mpl_token_metadata::ID @ MplHybridError::InvalidTokenMetadataProgram
    )]
    pub mpl_token_metadata: AccountInfo<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(address = Instructions::id() @ MplHybridError::InvalidInstructionsSysvarAddress)]
    pub sysvar_instructions: AccountInfo<'info>,
    pub system_program: Program<'info, System>,

    /// CHECK: This account is checked in the handler.
    pub user_token_record: AccountInfo<'info>,
    /// CHECK: This account is checked in the handler.
    pub destination_token_record: AccountInfo<'info>,
    /// CHECK: This account is checked in the handler.
    pub authorization_rules_program: AccountInfo<'info>,
    /// CHECK: This account is checked in the handler.
    pub authorization_rules: AccountInfo<'info>,
}

pub fn handle_deposit_tm_pnft_v1(
    ctx: Context<DepositTmPNftV1>,
    args: DepositTmNftV1Args,
) -> Result<()> {
    deposit(
        ctx.accounts.recipe.to_owned(),
        ctx.accounts.checklist.to_owned(),
        ctx.accounts.user_token_account.to_owned(),
        ctx.accounts.recipe_token_account.to_owned(),
        ctx.accounts.mint.to_owned(),
        ctx.accounts.metadata.to_owned(),
        ctx.accounts.edition.to_owned(),
        ctx.accounts.collection.to_owned(),
        ctx.accounts.payer.to_owned(),
        ctx.accounts.mpl_token_metadata.to_owned(),
        ctx.accounts.token_program.to_owned(),
        ctx.accounts.associated_token_program.to_owned(),
        ctx.accounts.sysvar_instructions.to_owned(),
        ctx.accounts.system_program.to_owned(),
        Some(ctx.accounts.user_token_record.to_owned()),
        Some(ctx.accounts.destination_token_record.to_owned()),
        Some(ctx.accounts.authorization_rules_program.to_owned()),
        Some(ctx.accounts.authorization_rules.to_owned()),
        args,
    )
}

pub fn handle_deposit_tm_nft_v1(
    ctx: Context<DepositTmNftV1>,
    args: DepositTmNftV1Args,
) -> Result<()> {
    deposit(
        ctx.accounts.recipe.to_owned(),
        ctx.accounts.checklist.to_owned(),
        ctx.accounts.user_token_account.to_owned(),
        ctx.accounts.recipe_token_account.to_owned(),
        ctx.accounts.mint.to_owned(),
        ctx.accounts.metadata.to_owned(),
        ctx.accounts.edition.to_owned(),
        ctx.accounts.collection.to_owned(),
        ctx.accounts.payer.to_owned(),
        ctx.accounts.mpl_token_metadata.to_owned(),
        ctx.accounts.token_program.to_owned(),
        ctx.accounts.associated_token_program.to_owned(),
        ctx.accounts.sysvar_instructions.to_owned(),
        ctx.accounts.system_program.to_owned(),
        None,
        None,
        None,
        None,
        args,
    )
}

#[allow(clippy::too_many_arguments)]
fn deposit<'info>(
    recipe: Account<'info, RecipeV1>,
    mut checklist: Account<'info, RecipeChecklistV1>,
    user_token_account: InterfaceAccount<'info, TokenAccount>,
    recipe_token_account: InterfaceAccount<'info, TokenAccount>,
    mint: InterfaceAccount<'info, Mint>,
    metadata: AccountInfo<'info>,
    edition: AccountInfo<'info>,
    _collection: AccountInfo<'info>,
    payer: Signer<'info>,
    mpl_token_metadata: AccountInfo<'info>,
    token_program: Interface<'info, TokenInterface>,
    associated_token_program: Program<'info, AssociatedToken>,
    sysvar_instructions: AccountInfo<'info>,
    system_program: Program<'info, System>,
    user_token_record: Option<AccountInfo<'info>>,
    destination_token_record: Option<AccountInfo<'info>>,
    authorization_rules_program: Option<AccountInfo<'info>>,
    authorization_rules: Option<AccountInfo<'info>>,
    args: DepositTmNftV1Args,
) -> Result<()> {
    // Guards
    let mut seeds = vec!["escrow".as_bytes()]
        .into_iter()
        .chain(recipe.get_input_keys())
        .collect::<Vec<&[u8]>>();

    let bump_seed = &[recipe.bump];
    seeds.push(bump_seed);

    // Check the account derivation.
    assert_derivation_with_bump(
        &crate::ID,
        &recipe.to_account_info(),
        &seeds,
        ProgramError::Custom(ErrorCode::ConstraintSeeds as u32),
    )?;

    // Perform the side effects.
    let (ingredients, checks) = match args.reversed {
        true => (&recipe.outputs, &mut checklist.outputs),
        false => (&recipe.inputs, &mut checklist.inputs),
    };

    // We only fetch the Base assets because we only need to check the collection here.
    let metadata_data = Metadata::safe_deserialize(&metadata.to_account_info().data.borrow())?;
    if metadata_data.mint != mint.key() {
        return Err(MplHybridError::InvalidMintAccount.into());
    }

    let position = if let Some(tm_collection) = metadata_data.collection {
        ingredients.iter().zip(checks.iter()).position(
            |(
                IngredientTriggerPairV1 {
                    ingredient,
                    trigger: _trigger,
                },
                checked,
            )| {
                !checked.ingredient_checked
                    && (matches!(ingredient, IngredientV1::TmNftCollection(collection) if *collection == tm_collection.key) || matches!(ingredient, IngredientV1::TmNft(asset) if *asset == mint.key()))
            },
        )
    } else {
        None
    };

    match position {
        Some(position) => {
            checks[position].ingredient_checked = true;
            TransferV1Cpi {
                __program: &mpl_token_metadata.to_account_info(),
                token: &user_token_account.to_account_info(),
                token_owner: &payer,
                destination_token: &recipe_token_account.to_account_info(),
                destination_owner: &recipe.to_account_info(),
                mint: &mint.to_account_info(),
                metadata: &metadata.to_account_info(),
                edition: Some(&edition.to_account_info()),
                token_record: user_token_record.as_ref(),
                destination_token_record: destination_token_record.as_ref(),
                authority: &payer,
                payer: &payer,
                system_program: &system_program,
                sysvar_instructions: &sysvar_instructions,
                spl_token_program: &token_program,
                spl_ata_program: &associated_token_program,
                authorization_rules_program: authorization_rules_program.as_ref(),
                authorization_rules: authorization_rules.as_ref(),
                __args: TransferV1InstructionArgs {
                    amount: 1,
                    authorization_data: None,
                },
            }
            .invoke()?;
        }
        None => return Err(MplHybridError::InvalidIngredient.into()),
    }

    Ok(())
}
