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
import { createCoreCollection, createUmi } from '../_setup';
import {
  EscrowV1,
  fetchEscrowV1,
  initEscrowV1,
  MPL_HYBRID_PROGRAM_ID,
  Path,
} from '../../src';

test('it can initialize the escrow', async (t) => {
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

  t.like(await fetchEscrowV1(umi, escrow), <EscrowV1>{
    publicKey: publicKey(escrow),
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com',
    max: 2n,
    min: 1n,
    amount: 3n,
    feeAmount: 4n,
    count: 1n,
    path: Path.RerollMetadata,
    bump: escrow[1],
    solFeeAmount: 5n,
  });
});

test('it cannot use an invalid collection', async (t) => {
  // Given a Umi instance using the project's plugin.
  const umi = await createUmi();
  const feeLocation = generateSigner(umi);
  const collection = generateSigner(umi);
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

  const result = initEscrowV1(umi, {
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

  await t.throwsAsync(result, { name: 'InvalidCollectionAccount' });
});

test('it cannot use an invalid token mint', async (t) => {
  // Given a Umi instance using the project's plugin.
  const umi = await createUmi();
  const feeLocation = generateSigner(umi);
  const { collection } = await createCoreCollection(umi);
  const tokenMint = generateSigner(umi);

  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('escrow'),
    publicKeySerializer().serialize(collection.publicKey),
  ]);

  const result = initEscrowV1(umi, {
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
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, {
    message:
      /AnchorError caused by account: token. Error Code: AccountNotInitialized./,
  });
});

test('it cannot set min higher than max', async (t) => {
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

  const result = initEscrowV1(umi, {
    escrow,
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com',
    max: 1,
    min: 2,
    amount: 3,
    feeAmount: 4,
    path: Path.RerollMetadata,
    solFeeAmount: 5,
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, { name: 'MaxMustBeGreaterThanMin' });
});
