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
  string,
  struct,
  u16,
  u64,
  u8,
} from '@metaplex-foundation/umi/serializers';
import {
  ResolvedAccount,
  ResolvedAccountsWithIndices,
  getAccountMetasAndSigners,
} from '../shared';

// Accounts.
export type UpdateEscrowV1InstructionAccounts = {
  escrow: PublicKey | Pda;
  authority?: Signer;
  collection: PublicKey | Pda;
  token: PublicKey | Pda;
  feeLocation: PublicKey | Pda;
  systemProgram?: PublicKey | Pda;
};

// Data.
export type UpdateEscrowV1InstructionData = {
  discriminator: Array<number>;
  name: string;
  uri: string;
  max: bigint;
  min: bigint;
  amount: bigint;
  feeAmount: bigint;
  solFeeAmount: bigint;
  path: number;
};

export type UpdateEscrowV1InstructionDataArgs = {
  name: string;
  uri: string;
  max: number | bigint;
  min: number | bigint;
  amount: number | bigint;
  feeAmount: number | bigint;
  solFeeAmount: number | bigint;
  path: number;
};

export function getUpdateEscrowV1InstructionDataSerializer(): Serializer<
  UpdateEscrowV1InstructionDataArgs,
  UpdateEscrowV1InstructionData
> {
  return mapSerializer<
    UpdateEscrowV1InstructionDataArgs,
    any,
    UpdateEscrowV1InstructionData
  >(
    struct<UpdateEscrowV1InstructionData>(
      [
        ['discriminator', array(u8(), { size: 8 })],
        ['name', string()],
        ['uri', string()],
        ['max', u64()],
        ['min', u64()],
        ['amount', u64()],
        ['feeAmount', u64()],
        ['solFeeAmount', u64()],
        ['path', u16()],
      ],
      { description: 'UpdateEscrowV1InstructionData' }
    ),
    (value) => ({
      ...value,
      discriminator: [72, 45, 208, 14, 174, 238, 27, 95],
    })
  ) as Serializer<
    UpdateEscrowV1InstructionDataArgs,
    UpdateEscrowV1InstructionData
  >;
}

// Args.
export type UpdateEscrowV1InstructionArgs = UpdateEscrowV1InstructionDataArgs;

// Instruction.
export function updateEscrowV1(
  context: Pick<Context, 'identity' | 'programs'>,
  input: UpdateEscrowV1InstructionAccounts & UpdateEscrowV1InstructionArgs
): TransactionBuilder {
  // Program ID.
  const programId = context.programs.getPublicKey(
    'mplHybrid',
    'MPL4o4wMzndgh8T1NVDxELQCj5UQfYTYEkabX3wNKtb'
  );

  // Accounts.
  const resolvedAccounts = {
    escrow: {
      index: 0,
      isWritable: true as boolean,
      value: input.escrow ?? null,
    },
    authority: {
      index: 1,
      isWritable: true as boolean,
      value: input.authority ?? null,
    },
    collection: {
      index: 2,
      isWritable: true as boolean,
      value: input.collection ?? null,
    },
    token: {
      index: 3,
      isWritable: false as boolean,
      value: input.token ?? null,
    },
    feeLocation: {
      index: 4,
      isWritable: false as boolean,
      value: input.feeLocation ?? null,
    },
    systemProgram: {
      index: 5,
      isWritable: false as boolean,
      value: input.systemProgram ?? null,
    },
  } satisfies ResolvedAccountsWithIndices;

  // Arguments.
  const resolvedArgs: UpdateEscrowV1InstructionArgs = { ...input };

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
  const data = getUpdateEscrowV1InstructionDataSerializer().serialize(
    resolvedArgs as UpdateEscrowV1InstructionDataArgs
  );

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
