/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import {
  Context,
  Option,
  OptionOrNullable,
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
  option,
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
export type UpdateNewDataV1InstructionAccounts = {
  nftData: PublicKey | Pda;
  authority?: Signer;
  collection: PublicKey | Pda;
  asset: PublicKey | Pda;
  token: PublicKey | Pda;
  feeLocation: PublicKey | Pda;
  systemProgram?: PublicKey | Pda;
};

// Data.
export type UpdateNewDataV1InstructionData = {
  discriminator: Array<number>;
  name: Option<string>;
  uri: Option<string>;
  max: Option<bigint>;
  min: Option<bigint>;
  amount: Option<bigint>;
  feeAmount: Option<bigint>;
  solFeeAmount: Option<bigint>;
  path: Option<number>;
};

export type UpdateNewDataV1InstructionDataArgs = {
  name: OptionOrNullable<string>;
  uri: OptionOrNullable<string>;
  max: OptionOrNullable<number | bigint>;
  min: OptionOrNullable<number | bigint>;
  amount: OptionOrNullable<number | bigint>;
  feeAmount: OptionOrNullable<number | bigint>;
  solFeeAmount: OptionOrNullable<number | bigint>;
  path: OptionOrNullable<number>;
};

export function getUpdateNewDataV1InstructionDataSerializer(): Serializer<
  UpdateNewDataV1InstructionDataArgs,
  UpdateNewDataV1InstructionData
> {
  return mapSerializer<
    UpdateNewDataV1InstructionDataArgs,
    any,
    UpdateNewDataV1InstructionData
  >(
    struct<UpdateNewDataV1InstructionData>(
      [
        ['discriminator', array(u8(), { size: 8 })],
        ['name', option(string())],
        ['uri', option(string())],
        ['max', option(u64())],
        ['min', option(u64())],
        ['amount', option(u64())],
        ['feeAmount', option(u64())],
        ['solFeeAmount', option(u64())],
        ['path', option(u16())],
      ],
      { description: 'UpdateNewDataV1InstructionData' }
    ),
    (value) => ({
      ...value,
      discriminator: [65, 122, 64, 164, 230, 47, 49, 230],
    })
  ) as Serializer<
    UpdateNewDataV1InstructionDataArgs,
    UpdateNewDataV1InstructionData
  >;
}

// Args.
export type UpdateNewDataV1InstructionArgs = UpdateNewDataV1InstructionDataArgs;

// Instruction.
export function updateNewDataV1(
  context: Pick<Context, 'identity' | 'programs'>,
  input: UpdateNewDataV1InstructionAccounts & UpdateNewDataV1InstructionArgs
): TransactionBuilder {
  // Program ID.
  const programId = context.programs.getPublicKey(
    'mplHybrid',
    'MPL4o4wMzndgh8T1NVDxELQCj5UQfYTYEkabX3wNKtb'
  );

  // Accounts.
  const resolvedAccounts = {
    nftData: {
      index: 0,
      isWritable: true as boolean,
      value: input.nftData ?? null,
    },
    authority: {
      index: 1,
      isWritable: true as boolean,
      value: input.authority ?? null,
    },
    collection: {
      index: 2,
      isWritable: false as boolean,
      value: input.collection ?? null,
    },
    asset: {
      index: 3,
      isWritable: false as boolean,
      value: input.asset ?? null,
    },
    token: {
      index: 4,
      isWritable: false as boolean,
      value: input.token ?? null,
    },
    feeLocation: {
      index: 5,
      isWritable: false as boolean,
      value: input.feeLocation ?? null,
    },
    systemProgram: {
      index: 6,
      isWritable: false as boolean,
      value: input.systemProgram ?? null,
    },
  } satisfies ResolvedAccountsWithIndices;

  // Arguments.
  const resolvedArgs: UpdateNewDataV1InstructionArgs = { ...input };

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
  const data = getUpdateNewDataV1InstructionDataSerializer().serialize(
    resolvedArgs as UpdateNewDataV1InstructionDataArgs
  );

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}
