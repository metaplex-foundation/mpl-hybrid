import test from 'ava';
import { generateSigner, publicKey } from '@metaplex-foundation/umi';
import {
  createFungible,
  mintV1,
  TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  string,
  publicKey as publicKeySerializer,
} from '@metaplex-foundation/umi/serializers';
import { addCollectionPlugin } from '@metaplex-foundation/mpl-core';
import {
  EscrowV1,
  fetchEscrowV1,
  initEscrowV1,
  MPL_HYBRID_PROGRAM_ID,
  Path,
  releaseV1,
} from '../src';
import { createCoreCollection, createUmi } from './_setup';

test('it can swap an asset for tokens', async (t) => {
  // Given a Umi instance using the project's plugin.
  const umi = await createUmi();
  const feeLocation = generateSigner(umi);
  const { assets, collection } = await createCoreCollection(umi);
  const tokenMint = generateSigner(umi);
  await createFungible(umi, {
    name: 'Test Token',
    uri: 'www.fungible.com',
    sellerFeeBasisPoints: {
      basisPoints: 0n,
      identifier: '%',
      decimals: 2,
    },
    mint: tokenMint,
  }).sendAndConfirm(umi);

  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('escrow'),
    publicKeySerializer().serialize(collection.publicKey),
  ]);

  await mintV1(umi, {
    mint: tokenMint.publicKey,
    tokenStandard: TokenStandard.Fungible,
    tokenOwner: escrow,
    amount: 1000,
  }).sendAndConfirm(umi);

  await initEscrowV1(umi, {
    escrow,
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com',
    max: 9,
    min: 0,
    amount: 5,
    feeAmount: 1,
    path: Path.RerollMetadata,
    solFeeAmount: 1000000n,
  }).sendAndConfirm(umi);

  const escrowData = await fetchEscrowV1(umi, escrow);

  t.like(escrowData, <EscrowV1>{
    publicKey: publicKey(escrow),
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com',
    max: 9n,
    min: 0n,
    amount: 5n,
    feeAmount: 1n,
    count: 1n,
    path: Path.RerollMetadata,
    bump: escrow[1],
    solFeeAmount: 1_000_000n,
  });

  await releaseV1(umi, {
    owner: umi.identity,
    escrow,
    asset: assets[0].publicKey,
    collection: collection.publicKey,
    feeProjectAccount: escrowData.feeLocation,
    token: tokenMint.publicKey,
  }).sendAndConfirm(umi);
});

test('it can swap an asset for tokens as UpdateDelegate', async (t) => {
  // Given a Umi instance using the project's plugin.
  const umi = await createUmi();
  const feeLocation = generateSigner(umi);
  const { assets, collection } = await createCoreCollection(umi);
  const tokenMint = generateSigner(umi);
  await createFungible(umi, {
    name: 'Test Token',
    uri: 'www.fungible.com',
    sellerFeeBasisPoints: {
      basisPoints: 0n,
      identifier: '%',
      decimals: 2,
    },
    mint: tokenMint,
  }).sendAndConfirm(umi);

  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('escrow'),
    publicKeySerializer().serialize(collection.publicKey),
  ]);

  await mintV1(umi, {
    mint: tokenMint.publicKey,
    tokenStandard: TokenStandard.Fungible,
    tokenOwner: escrow,
    amount: 1000,
  }).sendAndConfirm(umi);

  await initEscrowV1(umi, {
    escrow,
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com',
    max: 9,
    min: 0,
    amount: 5,
    feeAmount: 1,
    // eslint-disable-next-line no-bitwise
    path: 1 << Path.RerollMetadata,
    solFeeAmount: 1000000n,
  }).sendAndConfirm(umi);

  await addCollectionPlugin(umi, {
    collection: collection.publicKey,
    plugin: {
      type: 'UpdateDelegate',
      additionalDelegates: [],
      authority: { type: 'Address', address: publicKey(escrow) },
    },
  }).sendAndConfirm(umi);

  const escrowData = await fetchEscrowV1(umi, escrow);

  t.like(escrowData, <EscrowV1>{
    publicKey: publicKey(escrow),
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com',
    max: 9n,
    min: 0n,
    amount: 5n,
    feeAmount: 1n,
    count: 1n,
    // eslint-disable-next-line no-bitwise
    path: 1 << Path.RerollMetadata,
    bump: escrow[1],
    solFeeAmount: 1_000_000n,
  });

  await releaseV1(umi, {
    owner: umi.identity,
    authority: escrow,
    escrow,
    asset: assets[0].publicKey,
    collection: collection.publicKey,
    feeProjectAccount: escrowData.feeLocation,
    token: tokenMint.publicKey,
  }).sendAndConfirm(umi);
});
