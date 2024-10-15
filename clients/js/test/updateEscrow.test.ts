import test from 'ava';
import { generateSigner, publicKey } from '@metaplex-foundation/umi';
import {
  string,
  publicKey as publicKeySerializer,
} from '@metaplex-foundation/umi/serializers';
import { createFungible } from '@metaplex-foundation/mpl-token-metadata';
import {
  findAssociatedTokenPda,
  SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@metaplex-foundation/mpl-toolbox';
import { createCoreCollection, createUmi } from './_setup';
import {
  deserializeEscrowV1,
  EscrowV1,
  fetchEscrowV1,
  initEscrowV1,
  MPL_HYBRID_PROGRAM_ID,
  Path,
  updateEscrowV1,
} from '../src';

test('it can update an escrow', async (t) => {
  // Given a Umi instance using the project's plugin.
  const umi = await createUmi();
  const feeLocation = generateSigner(umi);
  const { collection } = await createCoreCollection(umi);
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

  await initEscrowV1(umi, {
    escrow,
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com',
    max: 2,
    min: 1,
    amount: 3,
    feeAmount: 4,
    path: Path.RerollMetadata,
    solFeeAmount: 5,
    feeAta: findAssociatedTokenPda(umi, {
      mint: tokenMint.publicKey,
      owner: publicKey(feeLocation.publicKey),
    }),
    associatedTokenProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
  }).sendAndConfirm(umi);

  await updateEscrowV1(umi, {
    escrow,
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    solFeeAmount: 6,
    name: 'Update Escrow',
    uri: 'www.test.com/updated',
    max: 5n,
    min: 1n,
    amount: 3n,
    feeAmount: 4n,
    path: Path.RerollMetadata,
  }).sendAndConfirm(umi, {
    // send: { commitment: 'confirmed' },
    // confirm: { commitment: 'confirmed' },
  });

  t.like(await fetchEscrowV1(umi, escrow), <EscrowV1>{
    publicKey: publicKey(escrow),
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Update Escrow',
    uri: 'www.test.com/updated',
    max: 5n,
    min: 1n,
    amount: 3n,
    feeAmount: 4n,
    count: 1n,
    path: Path.RerollMetadata,
    bump: escrow[1],
    solFeeAmount: 6n,
  });
});

test('it can update an escrow with a longer name and uri', async (t) => {
  // Given a Umi instance using the project's plugin.
  const umi = await createUmi();
  const feeLocation = generateSigner(umi);
  const { collection } = await createCoreCollection(umi);
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

  await initEscrowV1(umi, {
    escrow,
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com',
    max: 2,
    min: 1,
    amount: 3,
    feeAmount: 4,
    path: Path.RerollMetadata,
    solFeeAmount: 5,
    feeAta: findAssociatedTokenPda(umi, {
      mint: tokenMint.publicKey,
      owner: publicKey(feeLocation.publicKey),
    }),
    associatedTokenProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
  }).sendAndConfirm(umi);

  const initialEscrowRaw = await umi.rpc.getAccount(escrow[0]);
  if (!initialEscrowRaw.exists) {
    throw new Error('Escrow account not found');
  }

  await updateEscrowV1(umi, {
    escrow,
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    solFeeAmount: 6,
    name: 'Test Escrow Updated',
    uri: 'www.test.com/updated',
    max: 5n,
    min: 1n,
    amount: 3n,
    feeAmount: 4n,
    path: Path.RerollMetadata,
  }).sendAndConfirm(umi);

  const updatedEscrowRaw = await umi.rpc.getAccount(escrow[0]);
  if (!updatedEscrowRaw.exists) {
    throw new Error('Escrow account not found');
  }

  t.true(updatedEscrowRaw.data.length > initialEscrowRaw.data.length);

  t.like(await fetchEscrowV1(umi, escrow), <EscrowV1>{
    publicKey: publicKey(escrow),
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow Updated',
    uri: 'www.test.com/updated',
    max: 5n,
    min: 1n,
    amount: 3n,
    feeAmount: 4n,
    count: 1n,
    path: Path.RerollMetadata,
    bump: escrow[1],
    solFeeAmount: 6n,
  });
});

test('it can update an escrow with a shortner name and uri', async (t) => {
  // Given a Umi instance using the project's plugin.
  const umi = await createUmi();
  const feeLocation = generateSigner(umi);
  const { collection } = await createCoreCollection(umi);
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

  await initEscrowV1(umi, {
    escrow,
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com',
    max: 2,
    min: 1,
    amount: 3,
    feeAmount: 4,
    path: Path.RerollMetadata,
    solFeeAmount: 5,
    feeAta: findAssociatedTokenPda(umi, {
      mint: tokenMint.publicKey,
      owner: publicKey(feeLocation.publicKey),
    }),
    associatedTokenProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
  }).sendAndConfirm(umi);

  const initialEscrowRaw = await umi.rpc.getAccount(escrow[0]);
  if (!initialEscrowRaw.exists) {
    throw new Error('Escrow account not found');
  }

  await updateEscrowV1(umi, {
    escrow,
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    solFeeAmount: 6,
    name: 'Updated',
    uri: 'www.test.io',
    max: 5n,
    min: 1n,
    amount: 3n,
    feeAmount: 4n,
    path: Path.RerollMetadata,
  }).sendAndConfirm(umi);

  const updatedEscrowRaw = await umi.rpc.getAccount(escrow[0]);
  if (!updatedEscrowRaw.exists) {
    throw new Error('Escrow account not found');
  }

  t.true(updatedEscrowRaw.data.length < initialEscrowRaw.data.length);

  t.like(deserializeEscrowV1(updatedEscrowRaw), <EscrowV1>{
    publicKey: publicKey(escrow),
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Updated',
    uri: 'www.test.io',
    max: 5n,
    min: 1n,
    amount: 3n,
    feeAmount: 4n,
    count: 1n,
    path: Path.RerollMetadata,
    bump: escrow[1],
    solFeeAmount: 6n,
  });
});
