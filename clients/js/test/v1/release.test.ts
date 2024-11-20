import test from 'ava';
import { generateSigner, publicKey } from '@metaplex-foundation/umi';
import {
  createFungible,
  fetchDigitalAssetWithAssociatedToken,
  mintV1,
  TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  string,
  publicKey as publicKeySerializer,
} from '@metaplex-foundation/umi/serializers';
import { addCollectionPlugin, fetchAsset } from '@metaplex-foundation/mpl-core';
import {
  buildPath,
  EscrowV1,
  fetchEscrowV1,
  initEscrowV1,
  MPL_HYBRID_PROGRAM_ID,
  Path,
  releaseV1,
} from '../../src';
import { createCoreCollection, createUmi } from '../_setup';

test('it can swap an asset for tokens with reroll', async (t) => {
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

  const escrowTokenBefore = await fetchDigitalAssetWithAssociatedToken(
    umi,
    tokenMint.publicKey,
    publicKey(escrow)
  );
  t.deepEqual(escrowTokenBefore.token.amount, 1000n);
  try {
    await fetchDigitalAssetWithAssociatedToken(
      umi,
      tokenMint.publicKey,
      umi.identity.publicKey
    );
    t.fail('User token account should not exist');
  } catch (e) {
    t.is(e.name, 'AccountNotFoundError');
  }

  t.is(assets[0].owner, umi.identity.publicKey);

  await releaseV1(umi, {
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
  t.deepEqual(escrowTokenAfter.token.amount, 995n);
  const userTokenAfter = await fetchDigitalAssetWithAssociatedToken(
    umi,
    tokenMint.publicKey,
    umi.identity.publicKey
  );
  t.deepEqual(userTokenAfter.token.amount, 5n);
  const assetAfter = await fetchAsset(umi, assets[0].publicKey);
  t.is(assetAfter.owner, publicKey(escrow));

  // Confirm that an asset in the escrow has the correct URI
  t.is(assetAfter.uri, `${escrowData.uri}captured.json`);
});

test('it can swap an asset for tokens without reroll', async (t) => {
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
    uri: 'www.test.com/',
    max: 9,
    min: 0,
    amount: 5,
    feeAmount: 1,
    path: buildPath([Path.NoRerollMetadata]),
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
    path: buildPath([Path.NoRerollMetadata]),
    bump: escrow[1],
    solFeeAmount: 1_000_000n,
  });

  const escrowTokenBefore = await fetchDigitalAssetWithAssociatedToken(
    umi,
    tokenMint.publicKey,
    publicKey(escrow)
  );
  t.deepEqual(escrowTokenBefore.token.amount, 1000n);
  try {
    await fetchDigitalAssetWithAssociatedToken(
      umi,
      tokenMint.publicKey,
      umi.identity.publicKey
    );
    t.fail('User token account should not exist');
  } catch (e) {
    t.is(e.name, 'AccountNotFoundError');
  }

  t.is(assets[0].owner, umi.identity.publicKey);

  await releaseV1(umi, {
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
  t.deepEqual(escrowTokenAfter.token.amount, 995n);
  const userTokenAfter = await fetchDigitalAssetWithAssociatedToken(
    umi,
    tokenMint.publicKey,
    umi.identity.publicKey
  );
  t.deepEqual(userTokenAfter.token.amount, 5n);
  const assetAfter = await fetchAsset(umi, assets[0].publicKey);
  t.is(assetAfter.owner, publicKey(escrow));

  // Make sure the URI has not changed.
  t.is(assetAfter.uri, 'https://example.com/asset');
});

test('it can swap an asset for tokens as UpdateDelegate with reroll', async (t) => {
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
    uri: 'www.test.com/',
    max: 9,
    min: 0,
    amount: 5,
    feeAmount: 1,
    path: buildPath([Path.RerollMetadata]),
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

  const escrowTokenBefore = await fetchDigitalAssetWithAssociatedToken(
    umi,
    tokenMint.publicKey,
    publicKey(escrow)
  );
  t.deepEqual(escrowTokenBefore.token.amount, 1000n);
  try {
    await fetchDigitalAssetWithAssociatedToken(
      umi,
      tokenMint.publicKey,
      umi.identity.publicKey
    );
    t.fail('User token account should not exist');
  } catch (e) {
    t.is(e.name, 'AccountNotFoundError');
  }

  t.is(assets[0].owner, umi.identity.publicKey);

  await releaseV1(umi, {
    owner: umi.identity,
    authority: escrow,
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
  t.deepEqual(escrowTokenAfter.token.amount, 995n);
  const userTokenAfter = await fetchDigitalAssetWithAssociatedToken(
    umi,
    tokenMint.publicKey,
    umi.identity.publicKey
  );
  t.deepEqual(userTokenAfter.token.amount, 5n);
  const assetAfter = await fetchAsset(umi, assets[0].publicKey);
  t.is(assetAfter.owner, publicKey(escrow));

  // Confirm that an asset in the escrow has the correct URI
  t.is(assetAfter.uri, `${escrowData.uri}captured.json`);
});

test('it can swap an asset for tokens as UpdateDelegate without reroll', async (t) => {
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
    uri: 'www.test.com/',
    max: 9,
    min: 0,
    amount: 5,
    feeAmount: 1,
    path: buildPath([Path.NoRerollMetadata]),
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
    uri: 'www.test.com/',
    max: 9n,
    min: 0n,
    amount: 5n,
    feeAmount: 1n,
    count: 1n,
    path: buildPath([Path.NoRerollMetadata]),
    bump: escrow[1],
    solFeeAmount: 1_000_000n,
  });

  const escrowTokenBefore = await fetchDigitalAssetWithAssociatedToken(
    umi,
    tokenMint.publicKey,
    publicKey(escrow)
  );
  t.deepEqual(escrowTokenBefore.token.amount, 1000n);
  try {
    await fetchDigitalAssetWithAssociatedToken(
      umi,
      tokenMint.publicKey,
      umi.identity.publicKey
    );
    t.fail('User token account should not exist');
  } catch (e) {
    t.is(e.name, 'AccountNotFoundError');
  }

  t.is(assets[0].owner, umi.identity.publicKey);

  await releaseV1(umi, {
    owner: umi.identity,
    authority: escrow,
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
  t.deepEqual(escrowTokenAfter.token.amount, 995n);
  const userTokenAfter = await fetchDigitalAssetWithAssociatedToken(
    umi,
    tokenMint.publicKey,
    umi.identity.publicKey
  );
  t.deepEqual(userTokenAfter.token.amount, 5n);
  const assetAfter = await fetchAsset(umi, assets[0].publicKey);
  t.is(assetAfter.owner, publicKey(escrow));

  // Make sure the URI has not changed.
  t.is(assetAfter.uri, 'https://example.com/asset');
});
