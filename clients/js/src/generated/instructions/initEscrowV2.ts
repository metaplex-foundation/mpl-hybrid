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
  u8,
} from '@metaplex-foundation/umi/serializers';
import { findEscrowV2Pda } from '../accounts';
import {
  ResolvedAccount,
  ResolvedAccountsWithIndices,
  expectPublicKey,
  getAccountMetasAndSigners,
} from '../shared';

// Accounts.
export type InitEscrowV2InstructionAccounts = {
  escrow?: PublicKey | Pda;
  authority?: Signer;
  systemProgram?: PublicKey | Pda;
};

// Data.
export type InitEscrowV2InstructionData = { discriminator: Array<number> };

export type InitEscrowV2InstructionDataArgs = {};

export function getInitEscrowV2InstructionDataSerializer(): Serializer<
  InitEscrowV2InstructionDataArgs,
  InitEscrowV2InstructionData
> {
  return mapSerializer<
    InitEscrowV2InstructionDataArgs,
    any,
    InitEscrowV2InstructionData
  >(
    struct<InitEscrowV2InstructionData>(
      [['discriminator', array(u8(), { size: 8 })]],
      { description: 'InitEscrowV2InstructionData' }
    ),
    (value) => ({
      ...value,
      discriminator: [131, 108, 25, 241, 183, 34, 121, 27],
    })
  ) as Serializer<InitEscrowV2InstructionDataArgs, InitEscrowV2InstructionData>;
}

// Instruction.
export function initEscrowV2(
  context: Pick<Context, 'eddsa' | 'identity' | 'programs'>,
  input: InitEscrowV2InstructionAccounts
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
    systemProgram: {
      index: 2,
      isWritable: false as boolean,
      value: input.systemProgram ?? null,
    },
  } satisfies ResolvedAccountsWithIndices;

  // Default values.
  if (!resolvedAccounts.authority.value) {
    resolvedAccounts.authority.value = context.identity;
  }
  if (!resolvedAccounts.escrow.value) {
    resolvedAccounts.escrow.value = findEscrowV2Pda(context, {
      authority: expectPublicKey(resolvedAccounts.authority.value),
    });
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
  const data = getInitEscrowV2InstructionDataSerializer().serialize({});

  // Bytes Created On Chain.
  const bytesCreatedOnChain = 0;

  return transactionBuilder([
    { instruction: { keys, programId, data }, signers, bytesCreatedOnChain },
  ]);
}