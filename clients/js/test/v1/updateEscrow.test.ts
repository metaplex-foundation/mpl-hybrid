import { fetchAsset, transfer } from '@metaplex-foundation/mpl-core';
import {
  createFungible,
  fetchDigitalAssetWithAssociatedToken,
  mintV1,
  TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  findAssociatedTokenPda,
  SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@metaplex-foundation/mpl-toolbox';
import { generateSigner, publicKey } from '@metaplex-foundation/umi';
import {
  publicKey as publicKeySerializer,
  string,
} from '@metaplex-foundation/umi/serializers';
import test from 'ava';
import {
  buildPath,
  captureV1,
  deserializeEscrowV1,
  EscrowV1,
  fetchEscrowV1,
  initEscrowV1,
  MPL_HYBRID_PROGRAM_ID,
  Path,
  updateEscrowV1,
} from '../../src';
import { createCoreCollection, createUmi } from '../_setup';

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

// escrow swap count is set at a starting value of 1 during escrow init. 1 === no swap
test('it can update an escrow path if escrow swap count is at 1', async (t) => {
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
    path: Path.NoRerollMetadata,
  }).sendAndConfirm(umi);

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
    path: Path.NoRerollMetadata,
    bump: escrow[1],
    solFeeAmount: 6n,
  });
});

// escrow swap count is set at a starting value of 1 during escrow init. 1 === no swap
test('it will fail to update escrow Path if escrow swap count is greater than 1', async (t) => {
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

  await mintV1(umi, {
    mint: tokenMint.publicKey,
    tokenStandard: TokenStandard.Fungible,
    tokenOwner: umi.identity.publicKey,
    amount: 1000,
  }).sendAndConfirm(umi);

  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('escrow'),
    publicKeySerializer().serialize(collection.publicKey),
  ]);

  // Transfer the assets to the escrow.
  // eslint-disable-next-line no-restricted-syntax
  for (const asset of assets) {
    // eslint-disable-next-line no-await-in-loop
    await transfer(umi, {
      asset,
      collection,
      newOwner: escrow,
    }).sendAndConfirm(umi);
  }

  await initEscrowV1(umi, {
    escrow,
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 9,
    min: 0,
    amount: 5,
    feeAmount: 1,
    path: buildPath([Path.RerollMetadata]),
    solFeeAmount: 1000000n,
  }).sendAndConfirm(umi);

  const escrowData = await fetchEscrowV1(umi, escrow);

  t.like(escrowData, <EscrowV1>{
    publicKey: publicKey(escrow),
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 9n,
    min: 0n,
    amount: 5n,
    feeAmount: 1n,
    count: 1n,
    path: buildPath([Path.RerollMetadata]),
    bump: escrow[1],
    solFeeAmount: 1_000_000n,
  });

  const userTokenBefore = await fetchDigitalAssetWithAssociatedToken(
    umi,
    tokenMint.publicKey,
    umi.identity.publicKey
  );
  t.deepEqual(userTokenBefore.token.amount, 1000n);
  try {
    await fetchDigitalAssetWithAssociatedToken(
      umi,
      tokenMint.publicKey,
      publicKey(escrow)
    );
    t.fail('Escrow token account should not exist');
  } catch (e) {
    t.is(e.name, 'AccountNotFoundError');
  }

  const assetBefore = await fetchAsset(umi, assets[0].publicKey);
  t.is(assetBefore.owner, publicKey(escrow));

  await captureV1(umi, {
    owner: umi.identity,
    escrow,
    asset: assets[0].publicKey,
    collection: collection.publicKey,
    feeProjectAccount: escrowData.feeLocation,
    token: tokenMint.publicKey,
  }).sendAndConfirm(umi);

  const escrowTokenAfter = await fetchDigitalAssetWithAssociatedToken(
    umi,
    tokenMint.publicKey,
    publicKey(escrow)
  );
  t.deepEqual(escrowTokenAfter.token.amount, 5n);
  const userTokenAfter = await fetchDigitalAssetWithAssociatedToken(
    umi,
    tokenMint.publicKey,
    umi.identity.publicKey
  );
  t.deepEqual(userTokenAfter.token.amount, 994n);
  const feeTokenAfter = await fetchDigitalAssetWithAssociatedToken(
    umi,
    tokenMint.publicKey,
    escrowData.feeLocation
  );
  t.deepEqual(feeTokenAfter.token.amount, 1n);
  const assetAfter = await fetchAsset(umi, assets[0].publicKey);
  t.is(assetAfter.owner, umi.identity.publicKey);

  // Use a Regex to check the URI
  const uriRegex = new RegExp(`${escrowData.uri}\\d+\\.json`);
  t.regex(assetAfter.uri, uriRegex);

  const result = updateEscrowV1(umi, {
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
    path: buildPath([Path.NoRerollMetadata]),
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, { name: 'PathCannotBeSet' });
});
