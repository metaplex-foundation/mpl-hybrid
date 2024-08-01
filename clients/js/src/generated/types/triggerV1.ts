/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/metaplex-foundation/kinobi
 */

import { PublicKey } from '@metaplex-foundation/umi';
import {
  GetDataEnumKind,
  GetDataEnumKindContent,
  Serializer,
  dataEnum,
  publicKey as publicKeySerializer,
  string,
  struct,
  u32,
  u64,
  unit,
} from '@metaplex-foundation/umi/serializers';

export type TriggerV1 =
  | { __kind: 'None' }
  | { __kind: 'Rename'; name: string; uri: string; max: number; min: number }
  | { __kind: 'SolFee'; amount: bigint; feeAccount: PublicKey }
  | {
      __kind: 'TokenFee';
      amount: bigint;
      feeAccount: PublicKey;
      feeTokenAccount: PublicKey;
    };

export type TriggerV1Args =
  | { __kind: 'None' }
  | { __kind: 'Rename'; name: string; uri: string; max: number; min: number }
  | { __kind: 'SolFee'; amount: number | bigint; feeAccount: PublicKey }
  | {
      __kind: 'TokenFee';
      amount: number | bigint;
      feeAccount: PublicKey;
      feeTokenAccount: PublicKey;
    };

export function getTriggerV1Serializer(): Serializer<TriggerV1Args, TriggerV1> {
  return dataEnum<TriggerV1>(
    [
      ['None', unit()],
      [
        'Rename',
        struct<GetDataEnumKindContent<TriggerV1, 'Rename'>>([
          ['name', string()],
          ['uri', string()],
          ['max', u32()],
          ['min', u32()],
        ]),
      ],
      [
        'SolFee',
        struct<GetDataEnumKindContent<TriggerV1, 'SolFee'>>([
          ['amount', u64()],
          ['feeAccount', publicKeySerializer()],
        ]),
      ],
      [
        'TokenFee',
        struct<GetDataEnumKindContent<TriggerV1, 'TokenFee'>>([
          ['amount', u64()],
          ['feeAccount', publicKeySerializer()],
          ['feeTokenAccount', publicKeySerializer()],
        ]),
      ],
    ],
    { description: 'TriggerV1' }
  ) as Serializer<TriggerV1Args, TriggerV1>;
}

// Data Enum Helpers.
export function triggerV1(kind: 'None'): GetDataEnumKind<TriggerV1Args, 'None'>;
export function triggerV1(
  kind: 'Rename',
  data: GetDataEnumKindContent<TriggerV1Args, 'Rename'>
): GetDataEnumKind<TriggerV1Args, 'Rename'>;
export function triggerV1(
  kind: 'SolFee',
  data: GetDataEnumKindContent<TriggerV1Args, 'SolFee'>
): GetDataEnumKind<TriggerV1Args, 'SolFee'>;
export function triggerV1(
  kind: 'TokenFee',
  data: GetDataEnumKindContent<TriggerV1Args, 'TokenFee'>
): GetDataEnumKind<TriggerV1Args, 'TokenFee'>;
export function triggerV1<K extends TriggerV1Args['__kind']>(
  kind: K,
  data?: any
): Extract<TriggerV1Args, { __kind: K }> {
  return Array.isArray(data)
    ? { __kind: kind, fields: data }
    : { __kind: kind, ...(data ?? {}) };
}
export function isTriggerV1<K extends TriggerV1['__kind']>(
  kind: K,
  value: TriggerV1
): value is TriggerV1 & { __kind: K } {
  return value.__kind === kind;
}