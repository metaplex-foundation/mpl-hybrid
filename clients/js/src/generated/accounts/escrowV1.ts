/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import {
  Account,
  Context,
  Pda,
  PublicKey,
  RpcAccount,
  RpcGetAccountOptions,
  RpcGetAccountsOptions,
  assertAccountExists,
  deserializeAccount,
  gpaBuilder,
  publicKey as toPublicKey,
} from '@metaplex-foundation/umi';
import {
  Serializer,
  array,
  mapSerializer,
  publicKey as publicKeySerializer,
  string,
  struct,
  u16,
  u64,
  u8,
} from '@metaplex-foundation/umi/serializers';

export type EscrowV1 = Account<EscrowV1AccountData>;

export type EscrowV1AccountData = {
  discriminator: Array<number>;
  collection: PublicKey;
  authority: PublicKey;
  token: PublicKey;
  feeLocation: PublicKey;
  name: string;
  uri: string;
  max: bigint;
  min: bigint;
  amount: bigint;
  feeAmount: bigint;
  solFeeAmount: bigint;
  count: bigint;
  path: number;
  bump: number;
};

export type EscrowV1AccountDataArgs = {
  collection: PublicKey;
  authority: PublicKey;
  token: PublicKey;
  feeLocation: PublicKey;
  name: string;
  uri: string;
  max: number | bigint;
  min: number | bigint;
  amount: number | bigint;
  feeAmount: number | bigint;
  solFeeAmount: number | bigint;
  count: number | bigint;
  path: number;
  bump: number;
};

export function getEscrowV1AccountDataSerializer(): Serializer<
  EscrowV1AccountDataArgs,
  EscrowV1AccountData
> {
  return mapSerializer<EscrowV1AccountDataArgs, any, EscrowV1AccountData>(
    struct<EscrowV1AccountData>(
      [
        ['discriminator', array(u8(), { size: 8 })],
        ['collection', publicKeySerializer()],
        ['authority', publicKeySerializer()],
        ['token', publicKeySerializer()],
        ['feeLocation', publicKeySerializer()],
        ['name', string()],
        ['uri', string()],
        ['max', u64()],
        ['min', u64()],
        ['amount', u64()],
        ['feeAmount', u64()],
        ['solFeeAmount', u64()],
        ['count', u64()],
        ['path', u16()],
        ['bump', u8()],
      ],
      { description: 'EscrowV1AccountData' }
    ),
    (value) => ({
      ...value,
      discriminator: [26, 90, 193, 218, 188, 251, 139, 211],
    })
  ) as Serializer<EscrowV1AccountDataArgs, EscrowV1AccountData>;
}

export function deserializeEscrowV1(rawAccount: RpcAccount): EscrowV1 {
  return deserializeAccount(rawAccount, getEscrowV1AccountDataSerializer());
}

export async function fetchEscrowV1(
  context: Pick<Context, 'rpc'>,
  publicKey: PublicKey | Pda,
  options?: RpcGetAccountOptions
): Promise<EscrowV1> {
  const maybeAccount = await context.rpc.getAccount(
    toPublicKey(publicKey, false),
    options
  );
  assertAccountExists(maybeAccount, 'EscrowV1');
  return deserializeEscrowV1(maybeAccount);
}

export async function safeFetchEscrowV1(
  context: Pick<Context, 'rpc'>,
  publicKey: PublicKey | Pda,
  options?: RpcGetAccountOptions
): Promise<EscrowV1 | null> {
  const maybeAccount = await context.rpc.getAccount(
    toPublicKey(publicKey, false),
    options
  );
  return maybeAccount.exists ? deserializeEscrowV1(maybeAccount) : null;
}

export async function fetchAllEscrowV1(
  context: Pick<Context, 'rpc'>,
  publicKeys: Array<PublicKey | Pda>,
  options?: RpcGetAccountsOptions
): Promise<EscrowV1[]> {
  const maybeAccounts = await context.rpc.getAccounts(
    publicKeys.map((key) => toPublicKey(key, false)),
    options
  );
  return maybeAccounts.map((maybeAccount) => {
    assertAccountExists(maybeAccount, 'EscrowV1');
    return deserializeEscrowV1(maybeAccount);
  });
}

export async function safeFetchAllEscrowV1(
  context: Pick<Context, 'rpc'>,
  publicKeys: Array<PublicKey | Pda>,
  options?: RpcGetAccountsOptions
): Promise<EscrowV1[]> {
  const maybeAccounts = await context.rpc.getAccounts(
    publicKeys.map((key) => toPublicKey(key, false)),
    options
  );
  return maybeAccounts
    .filter((maybeAccount) => maybeAccount.exists)
    .map((maybeAccount) => deserializeEscrowV1(maybeAccount as RpcAccount));
}

export function getEscrowV1GpaBuilder(
  context: Pick<Context, 'rpc' | 'programs'>
) {
  const programId = context.programs.getPublicKey(
    'mplHybrid',
    'MPL4o4wMzndgh8T1NVDxELQCj5UQfYTYEkabX3wNKtb'
  );
  return gpaBuilder(context, programId)
    .registerFields<{
      discriminator: Array<number>;
      collection: PublicKey;
      authority: PublicKey;
      token: PublicKey;
      feeLocation: PublicKey;
      name: string;
      uri: string;
      max: number | bigint;
      min: number | bigint;
      amount: number | bigint;
      feeAmount: number | bigint;
      solFeeAmount: number | bigint;
      count: number | bigint;
      path: number;
      bump: number;
    }>({
      discriminator: [0, array(u8(), { size: 8 })],
      collection: [8, publicKeySerializer()],
      authority: [40, publicKeySerializer()],
      token: [72, publicKeySerializer()],
      feeLocation: [104, publicKeySerializer()],
      name: [136, string()],
      uri: [null, string()],
      max: [null, u64()],
      min: [null, u64()],
      amount: [null, u64()],
      feeAmount: [null, u64()],
      solFeeAmount: [null, u64()],
      count: [null, u64()],
      path: [null, u16()],
      bump: [null, u8()],
    })
    .deserializeUsing<EscrowV1>((account) => deserializeEscrowV1(account))
    .whereField('discriminator', [26, 90, 193, 218, 188, 251, 139, 211]);
}

export function findEscrowV1Pda(
  context: Pick<Context, 'eddsa' | 'programs'>,
  seeds: {
    /** The address of the collection */
    collection: PublicKey;
  }
): Pda {
  const programId = context.programs.getPublicKey(
    'mplHybrid',
    'MPL4o4wMzndgh8T1NVDxELQCj5UQfYTYEkabX3wNKtb'
  );
  return context.eddsa.findPda(programId, [
    string({ size: 'variable' }).serialize('escrow'),
    publicKeySerializer().serialize(seeds.collection),
  ]);
}

export async function fetchEscrowV1FromSeeds(
  context: Pick<Context, 'eddsa' | 'programs' | 'rpc'>,
  seeds: Parameters<typeof findEscrowV1Pda>[1],
  options?: RpcGetAccountOptions
): Promise<EscrowV1> {
  return fetchEscrowV1(context, findEscrowV1Pda(context, seeds), options);
}

export async function safeFetchEscrowV1FromSeeds(
  context: Pick<Context, 'eddsa' | 'programs' | 'rpc'>,
  seeds: Parameters<typeof findEscrowV1Pda>[1],
  options?: RpcGetAccountOptions
): Promise<EscrowV1 | null> {
  return safeFetchEscrowV1(context, findEscrowV1Pda(context, seeds), options);
}
