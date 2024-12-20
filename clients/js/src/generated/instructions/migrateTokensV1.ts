/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import {
  Context,
  Pda,
  PublicKey,
  Signer,
  TransactionBuilder,
  transactionBuilder,
} from '@metaplex-foundation/umi';
import {
  Serializer,
  array,
  mapSerializer,
  struct,
  u64,
  u8,
} from '@metaplex-foundation/umi/serializers';
import {
  ResolvedAccount,
  ResolvedAccountsWithIndices,
  getAccountMetasAndSigners,
} from '../shared';

// Accounts.
export type MigrateTokensV1InstructionAccounts = {
  authority?: Signer;
  escrowNew: PublicKey | Pda;
  escrowOld: PublicKey | Pda;
  collection: PublicKey | Pda;
  escrowNewTokenAccount: PublicKey | Pda;
  escrowOldTokenAccount: PublicKey | Pda;
  token: PublicKey | Pda;
  systemProgram?: PublicKey | Pda;
  tokenProgram?: PublicKey | Pda;
  associatedTokenProgram: PublicKey | Pda;
};

// Data.
export type MigrateTokensV1InstructionData = {
  discriminator: Array<number>;
  amount: bigint;
};

export type MigrateTokensV1InstructionDataArgs = { amount: number | bigint };

export function getMigrateTokensV1InstructionDataSerializer(): Serializer<
  MigrateTokensV1InstructionDataArgs,
  MigrateTokensV1InstructionData
> {
  return mapSerializer<
    MigrateTokensV1InstructionDataArgs,
    any,
    MigrateTokensV1InstructionData
  >(
    struct<MigrateTokensV1InstructionData>(
      [
        ['discriminator', array(u8(), { size: 8 })],
        ['amount', u64()],
      ],
      { description: 'MigrateTokensV1InstructionData' }
    ),
    (value) => ({
      ...value,
      discriminator: [214, 119, 117, 84, 29, 252, 202, 13],
    })
  ) as Serializer<
    MigrateTokensV1InstructionDataArgs,
    MigrateTokensV1InstructionData
  >;
}

// Args.
export type MigrateTokensV1InstructionArgs = MigrateTokensV1InstructionDataArgs;

// Instruction.
export function migrateTokensV1(
  context: Pick<Context, 'identity' | 'programs'>,
  input: MigrateTokensV1InstructionAccounts & MigrateTokensV1InstructionArgs
): TransactionBuilder {
  // Program ID.
  const programId = context.programs.getPublicKey(
    'mplHybrid',
    'MPL4o4wMzndgh8T1NVDxELQCj5UQfYTYEkabX3wNKtb'
  );

  // Accounts.
  const resolvedAccounts = {
    authority: {
      index: 0,
      isWritable: true as boolean,
      value: input.authority ?? null,
    },
    escrowNew: {
      index: 1,
      isWritable: true as boolean,
      value: input.escrowNew ?? null,
    },
    escrowOld: {
      index: 2,
      isWritable: true as boolean,
      value: input.escrowOld ?? null,
    },
    collection: {
      index: 3,
      isWritable: true as boolean,
      value: input.collection ?? null,
    },
    escrowNewTokenAccount: {
      index: 4,
      isWritable: true as boolean,
      value: input.escrowNewTokenAccount ?? null,
    },
    escrowOldTokenAccount: {
      index: 5,
      isWritable: true as boolean,
      value: input.escrowOldTokenAccount ?? null,
    },
    token: {
      index: 6,
      isWritable: false as boolean,
      value: input.token ?? null,
    },
    systemProgram: {
      index: 7,
      isWritable: false as boolean,
      value: input.systemProgram ?? null,
    },
    tokenProgram: {
      index: 8,
      isWritable: false as boolean,
      value: input.tokenProgram ?? null,
    },
    associatedTokenProgram: {
      index: 9,
      isWritable: false as boolean,
      value: input.associatedTokenProgram ?? null,
    },
  } satisfies ResolvedAccountsWithIndices;

  // Arguments.
  const resolvedArgs: MigrateTokensV1InstructionArgs = { ...input };

  // Default values.
  if (!resolvedAccounts.authority.value) {
    resolvedAccounts.authority.value = context.identity;
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
  const data = getMigrateTokensV1InstructionDataSerializer().serialize(
    resolvedArgs as MigrateTokensV1InstructionDataArgs
  );

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
