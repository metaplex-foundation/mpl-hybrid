/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';
import {
  Context,
  Pda,
  PublicKey,
  Signer,
  TransactionBuilder,
  publicKey,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import {
  Serializer,
  array,
  mapSerializer,
  struct,
  u8,
} from '@metaplex-foundation/umi/serializers';
import {
  ResolvedAccount,
  ResolvedAccountsWithIndices,
  expectPublicKey,
  getAccountMetasAndSigners,
} from '../shared';

// Accounts.
export type ReleaseV1InstructionAccounts = {
  owner: Signer;
  authority?: Signer;
  escrow: PublicKey | Pda;
  asset: PublicKey | Pda;
  collection: PublicKey | Pda;
  userTokenAccount?: PublicKey | Pda;
  escrowTokenAccount?: PublicKey | Pda;
  token: PublicKey | Pda;
  feeTokenAccount?: PublicKey | Pda;
  feeSolAccount?: PublicKey | Pda;
  feeProjectAccount: PublicKey | Pda;
  recentBlockhashes?: PublicKey | Pda;
  mplCore?: PublicKey | Pda;
  systemProgram?: PublicKey | Pda;
  tokenProgram?: PublicKey | Pda;
  associatedTokenProgram?: PublicKey | Pda;
};

// Data.
export type ReleaseV1InstructionData = { discriminator: Array<number> };

export type ReleaseV1InstructionDataArgs = {};

export function getReleaseV1InstructionDataSerializer(): Serializer<
  ReleaseV1InstructionDataArgs,
  ReleaseV1InstructionData
> {
  return mapSerializer<
    ReleaseV1InstructionDataArgs,
    any,
    ReleaseV1InstructionData
  >(
    struct<ReleaseV1InstructionData>(
      [['discriminator', array(u8(), { size: 8 })]],
      { description: 'ReleaseV1InstructionData' }
    ),
    (value) => ({
      ...value,
      discriminator: [86, 208, 216, 30, 127, 65, 71, 80],
    })
  ) as Serializer<ReleaseV1InstructionDataArgs, ReleaseV1InstructionData>;
}

// Instruction.
export function releaseV1(
  context: Pick<Context, 'eddsa' | 'identity' | 'programs'>,
  input: ReleaseV1InstructionAccounts
): TransactionBuilder {
  // Program ID.
  const programId = context.programs.getPublicKey(
    'mplHybrid',
    'MPL4o4wMzndgh8T1NVDxELQCj5UQfYTYEkabX3wNKtb'
  );

  // Accounts.
  const resolvedAccounts = {
    owner: {
      index: 0,
      isWritable: true as boolean,
      value: input.owner ?? null,
    },
    authority: {
      index: 1,
      isWritable: true as boolean,
      value: input.authority ?? null,
    },
    escrow: {
      index: 2,
      isWritable: true as boolean,
      value: input.escrow ?? null,
    },
    asset: {
      index: 3,
      isWritable: true as boolean,
      value: input.asset ?? null,
    },
    collection: {
      index: 4,
      isWritable: true as boolean,
      value: input.collection ?? null,
    },
    userTokenAccount: {
      index: 5,
      isWritable: true as boolean,
      value: input.userTokenAccount ?? null,
    },
    escrowTokenAccount: {
      index: 6,
      isWritable: true as boolean,
      value: input.escrowTokenAccount ?? null,
    },
    token: {
      index: 7,
      isWritable: false as boolean,
      value: input.token ?? null,
    },
    feeTokenAccount: {
      index: 8,
      isWritable: true as boolean,
      value: input.feeTokenAccount ?? null,
    },
    feeSolAccount: {
      index: 9,
      isWritable: true as boolean,
      value: input.feeSolAccount ?? null,
    },
    feeProjectAccount: {
      index: 10,
      isWritable: true as boolean,
      value: input.feeProjectAccount ?? null,
    },
    recentBlockhashes: {
      index: 11,
      isWritable: false as boolean,
      value: input.recentBlockhashes ?? null,
    },
    mplCore: {
      index: 12,
      isWritable: false as boolean,
      value: input.mplCore ?? null,
    },
    systemProgram: {
      index: 13,
      isWritable: false as boolean,
      value: input.systemProgram ?? null,
    },
    tokenProgram: {
      index: 14,
      isWritable: false as boolean,
      value: input.tokenProgram ?? null,
    },
    associatedTokenProgram: {
      index: 15,
      isWritable: false as boolean,
      value: input.associatedTokenProgram ?? null,
    },
  } satisfies ResolvedAccountsWithIndices;

  // Default values.
  if (!resolvedAccounts.authority.value) {
    resolvedAccounts.authority.value = context.identity;
  }
  if (!resolvedAccounts.userTokenAccount.value) {
    resolvedAccounts.userTokenAccount.value = findAssociatedTokenPda(context, {
      mint: expectPublicKey(resolvedAccounts.token.value),
      owner: expectPublicKey(resolvedAccounts.owner.value),
    });
  }
  if (!resolvedAccounts.escrowTokenAccount.value) {
    resolvedAccounts.escrowTokenAccount.value = findAssociatedTokenPda(
      context,
      {
        mint: expectPublicKey(resolvedAccounts.token.value),
        owner: expectPublicKey(resolvedAccounts.escrow.value),
      }
    );
  }
  if (!resolvedAccounts.feeTokenAccount.value) {
    resolvedAccounts.feeTokenAccount.value = findAssociatedTokenPda(context, {
      mint: expectPublicKey(resolvedAccounts.token.value),
      owner: expectPublicKey(resolvedAccounts.feeProjectAccount.value),
    });
  }
  if (!resolvedAccounts.feeSolAccount.value) {
    resolvedAccounts.feeSolAccount.value = publicKey(
      'GjF4LqmEhV33riVyAwHwiEeAHx4XXFn2yMY3fmMigoP3'
    );
  }
  if (!resolvedAccounts.recentBlockhashes.value) {
    resolvedAccounts.recentBlockhashes.value = publicKey(
      'SysvarS1otHashes111111111111111111111111111'
    );
  }
  if (!resolvedAccounts.mplCore.value) {
    resolvedAccounts.mplCore.value = publicKey(
      'CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d'
    );
  }
  if (!resolvedAccounts.systemProgram.value) {
    resolvedAccounts.systemProgram.value = context.programs.getPublicKey(
      'splSystem',
      '11111111111111111111111111111111'
    );
    resolvedAccounts.systemProgram.isWritable = false;
  }
  if (!resolvedAccounts.tokenProgram.value) {
    resolvedAccounts.tokenProgram.value = context.programs.getPublicKey(
      'splToken',
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
    );
    resolvedAccounts.tokenProgram.isWritable = false;
  }
  if (!resolvedAccounts.associatedTokenProgram.value) {
    resolvedAccounts.associatedTokenProgram.value = publicKey(
      'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
    );
  }

  // Accounts in order.
  const orderedAccounts: ResolvedAccount[] = Object.values(
    resolvedAccounts
  ).sort((a, b) => a.index - b.index);

  // Keys and Signers.
  const [keys, signers] = getAccountMetasAndSigners(
    orderedAccounts,
    'programId',
    programId
  );

  // Data.
  const data = getReleaseV1InstructionDataSerializer().serialize({});

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
