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
  EscrowV2,
  fetchEscrowV2,
  fetchRecipeV1,
  initEscrowV2,
  initRecipeV1,
  MPL_HYBRID_PROGRAM_ID,
  Path,
  releaseV2,
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

  await initEscrowV2(umi, {}).sendAndConfirm(umi);

  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('escrow'),
    publicKeySerializer().serialize(umi.identity.publicKey),
  ]);

  t.like(await fetchEscrowV2(umi, escrow), <EscrowV2>{
    authority: umi.identity.publicKey,
    bump: escrow[1],
  });

  await mintV1(umi, {
    mint: tokenMint.publicKey,
    tokenStandard: TokenStandard.Fungible,
    tokenOwner: escrow,
    amount: 1000,
  }).sendAndConfirm(umi);

  await initRecipeV1(umi, {
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 9,
    min: 0,
    amount: 5,
    feeAmountCapture: 1,
    feeAmountRelease: 0,
    solFeeAmountCapture: 100_000n,
    solFeeAmountRelease: 890_880n,
    path: buildPath([Path.RerollMetadata]),
  }).sendAndConfirm(umi);

  const recipe = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('recipe'),
    publicKeySerializer().serialize(collection.publicKey),
  ]);

  const recipeData = await fetchRecipeV1(umi, recipe);
  t.like(recipeData, {
    publicKey: publicKey(recipe),
    collection: collection.publicKey,
    authority: umi.identity.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 9n,
    min: 0n,
    amount: 5n,
    feeAmountCapture: 1n,
    feeAmountRelease: 0n,
    solFeeAmountCapture: 100_000n,
    solFeeAmountRelease: 890_880n,
    count: 1n,
    path: buildPath([Path.RerollMetadata]),
    bump: recipe[1],
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

  await releaseV2(umi, {
    owner: umi.identity,
    recipe,
    escrow,
    asset: assets[0].publicKey,
    collection: collection.publicKey,
    feeProjectAccount: feeLocation.publicKey,
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
  t.is(assetAfter.uri, `${recipeData.uri}captured.json`);
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

  await initEscrowV2(umi, {}).sendAndConfirm(umi);

  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('escrow'),
    publicKeySerializer().serialize(umi.identity.publicKey),
  ]);

  t.like(await fetchEscrowV2(umi, escrow), <EscrowV2>{
    authority: umi.identity.publicKey,
    bump: escrow[1],
  });

  await mintV1(umi, {
    mint: tokenMint.publicKey,
    tokenStandard: TokenStandard.Fungible,
    tokenOwner: escrow,
    amount: 1000,
  }).sendAndConfirm(umi);

  await initRecipeV1(umi, {
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 9,
    min: 0,
    amount: 5,
    feeAmountCapture: 1,
    feeAmountRelease: 0,
    solFeeAmountCapture: 100_000n,
    solFeeAmountRelease: 890_880n,
    path: buildPath([Path.NoRerollMetadata]),
  }).sendAndConfirm(umi);

  const recipe = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('recipe'),
    publicKeySerializer().serialize(collection.publicKey),
  ]);

  t.like(await fetchRecipeV1(umi, recipe), {
    publicKey: publicKey(recipe),
    collection: collection.publicKey,
    authority: umi.identity.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 9n,
    min: 0n,
    amount: 5n,
    feeAmountCapture: 1n,
    feeAmountRelease: 0n,
    solFeeAmountCapture: 100_000n,
    solFeeAmountRelease: 890_880n,
    count: 1n,
    path: buildPath([Path.NoRerollMetadata]),
    bump: recipe[1],
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

  await releaseV2(umi, {
    owner: umi.identity,
    recipe,
    escrow,
    asset: assets[0].publicKey,
    collection: collection.publicKey,
    feeProjectAccount: feeLocation.publicKey,
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

  await initEscrowV2(umi, {}).sendAndConfirm(umi);

  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('escrow'),
    publicKeySerializer().serialize(umi.identity.publicKey),
  ]);

  t.like(await fetchEscrowV2(umi, escrow), <EscrowV2>{
    authority: umi.identity.publicKey,
    bump: escrow[1],
  });

  await mintV1(umi, {
    mint: tokenMint.publicKey,
    tokenStandard: TokenStandard.Fungible,
    tokenOwner: escrow,
    amount: 1000,
  }).sendAndConfirm(umi);

  await initRecipeV1(umi, {
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 9,
    min: 0,
    amount: 5,
    feeAmountCapture: 1,
    feeAmountRelease: 0,
    solFeeAmountCapture: 100_000n,
    solFeeAmountRelease: 890_880n,
    path: buildPath([Path.RerollMetadata]),
  }).sendAndConfirm(umi);

  const recipe = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('recipe'),
    publicKeySerializer().serialize(collection.publicKey),
  ]);

  await addCollectionPlugin(umi, {
    collection: collection.publicKey,
    plugin: {
      type: 'UpdateDelegate',
      additionalDelegates: [],
      authority: { type: 'Address', address: publicKey(recipe) },
    },
  }).sendAndConfirm(umi);

  const recipeData = await fetchRecipeV1(umi, recipe);
  t.like(recipeData, {
    publicKey: publicKey(recipe),
    collection: collection.publicKey,
    authority: umi.identity.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 9n,
    min: 0n,
    amount: 5n,
    feeAmountCapture: 1n,
    feeAmountRelease: 0n,
    solFeeAmountCapture: 100_000n,
    solFeeAmountRelease: 890_880n,
    count: 1n,
    path: buildPath([Path.RerollMetadata]),
    bump: recipe[1],
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

  await releaseV2(umi, {
    owner: umi.identity,
    authority: recipe,
    recipe,
    escrow,
    asset: assets[0].publicKey,
    collection: collection.publicKey,
    feeProjectAccount: feeLocation.publicKey,
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
  t.is(assetAfter.uri, `${recipeData.uri}captured.json`);
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

  await initEscrowV2(umi, {}).sendAndConfirm(umi);

  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('escrow'),
    publicKeySerializer().serialize(umi.identity.publicKey),
  ]);

  t.like(await fetchEscrowV2(umi, escrow), <EscrowV2>{
    authority: umi.identity.publicKey,
    bump: escrow[1],
  });

  await mintV1(umi, {
    mint: tokenMint.publicKey,
    tokenStandard: TokenStandard.Fungible,
    tokenOwner: escrow,
    amount: 1000,
  }).sendAndConfirm(umi);

  await initRecipeV1(umi, {
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 9,
    min: 0,
    amount: 5,
    feeAmountCapture: 1,
    feeAmountRelease: 0,
    solFeeAmountCapture: 100_000n,
    solFeeAmountRelease: 890_880n,
    path: buildPath([Path.NoRerollMetadata]),
  }).sendAndConfirm(umi);

  const recipe = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('recipe'),
    publicKeySerializer().serialize(collection.publicKey),
  ]);

  await addCollectionPlugin(umi, {
    collection: collection.publicKey,
    plugin: {
      type: 'UpdateDelegate',
      additionalDelegates: [],
      authority: { type: 'Address', address: publicKey(recipe) },
    },
  }).sendAndConfirm(umi);

  t.like(await fetchRecipeV1(umi, recipe), {
    publicKey: publicKey(recipe),
    collection: collection.publicKey,
    authority: umi.identity.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 9n,
    min: 0n,
    amount: 5n,
    feeAmountCapture: 1n,
    feeAmountRelease: 0n,
    solFeeAmountCapture: 100_000n,
    solFeeAmountRelease: 890_880n,
    count: 1n,
    path: buildPath([Path.NoRerollMetadata]),
    bump: recipe[1],
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

  await releaseV2(umi, {
    owner: umi.identity,
    authority: recipe,
    recipe,
    escrow,
    asset: assets[0].publicKey,
    collection: collection.publicKey,
    feeProjectAccount: feeLocation.publicKey,
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

test('it cannot swap an asset for tokens with BlockRelease', async (t) => {
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

  await initEscrowV2(umi, {}).sendAndConfirm(umi);

  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('escrow'),
    publicKeySerializer().serialize(umi.identity.publicKey),
  ]);

  t.like(await fetchEscrowV2(umi, escrow), <EscrowV2>{
    authority: umi.identity.publicKey,
    bump: escrow[1],
  });

  await mintV1(umi, {
    mint: tokenMint.publicKey,
    tokenStandard: TokenStandard.Fungible,
    tokenOwner: escrow,
    amount: 1000,
  }).sendAndConfirm(umi);

  await initRecipeV1(umi, {
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 9,
    min: 0,
    amount: 5,
    feeAmountCapture: 1,
    feeAmountRelease: 0,
    solFeeAmountCapture: 100_000n,
    solFeeAmountRelease: 890_880n,
    path: buildPath([Path.NoRerollMetadata, Path.BlockRelease]),
  }).sendAndConfirm(umi);

  const recipe = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('recipe'),
    publicKeySerializer().serialize(collection.publicKey),
  ]);

  await addCollectionPlugin(umi, {
    collection: collection.publicKey,
    plugin: {
      type: 'UpdateDelegate',
      additionalDelegates: [],
      authority: { type: 'Address', address: publicKey(recipe) },
    },
  }).sendAndConfirm(umi);

  t.like(await fetchRecipeV1(umi, recipe), {
    publicKey: publicKey(recipe),
    collection: collection.publicKey,
    authority: umi.identity.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 9n,
    min: 0n,
    amount: 5n,
    feeAmountCapture: 1n,
    feeAmountRelease: 0n,
    solFeeAmountCapture: 100_000n,
    solFeeAmountRelease: 890_880n,
    count: 1n,
    path: buildPath([Path.NoRerollMetadata, Path.BlockRelease]),
    bump: recipe[1],
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

  const result = releaseV2(umi, {
    owner: umi.identity,
    authority: recipe,
    recipe,
    escrow,
    asset: assets[0].publicKey,
    collection: collection.publicKey,
    feeProjectAccount: feeLocation.publicKey,
    token: tokenMint.publicKey,
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, { name: 'ReleaseBlocked' });
});

test('it can burn an asset for tokens with BurnOnRelease', async (t) => {
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

  await initEscrowV2(umi, {}).sendAndConfirm(umi);

  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('escrow'),
    publicKeySerializer().serialize(umi.identity.publicKey),
  ]);

  t.like(await fetchEscrowV2(umi, escrow), <EscrowV2>{
    authority: umi.identity.publicKey,
    bump: escrow[1],
  });

  await mintV1(umi, {
    mint: tokenMint.publicKey,
    tokenStandard: TokenStandard.Fungible,
    tokenOwner: escrow,
    amount: 1000,
  }).sendAndConfirm(umi);

  await initRecipeV1(umi, {
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 9,
    min: 0,
    amount: 5,
    feeAmountCapture: 1,
    feeAmountRelease: 0,
    solFeeAmountCapture: 100_000n,
    solFeeAmountRelease: 890_880n,
    path: buildPath([Path.NoRerollMetadata, Path.BurnOnRelease]),
  }).sendAndConfirm(umi);

  const recipe = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('recipe'),
    publicKeySerializer().serialize(collection.publicKey),
  ]);

  await addCollectionPlugin(umi, {
    collection: collection.publicKey,
    plugin: {
      type: 'UpdateDelegate',
      additionalDelegates: [],
      authority: { type: 'Address', address: publicKey(recipe) },
    },
  }).sendAndConfirm(umi);

  t.like(await fetchRecipeV1(umi, recipe), {
    publicKey: publicKey(recipe),
    collection: collection.publicKey,
    authority: umi.identity.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 9n,
    min: 0n,
    amount: 5n,
    feeAmountCapture: 1n,
    feeAmountRelease: 0n,
    solFeeAmountCapture: 100_000n,
    solFeeAmountRelease: 890_880n,
    count: 1n,
    path: buildPath([Path.NoRerollMetadata, Path.BurnOnRelease]),
    bump: recipe[1],
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

  await releaseV2(umi, {
    owner: umi.identity,
    authority: recipe,
    recipe,
    escrow,
    asset: assets[0].publicKey,
    collection: collection.publicKey,
    feeProjectAccount: feeLocation.publicKey,
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

  // The asset should be burned.
  const assetAfter = await umi.rpc.getAccount(assets[0].publicKey);
  if (assetAfter.exists) {
    t.deepEqual(assetAfter.data, Uint8Array.from([0]));
  } else {
    t.fail('Asset should exist as burned');
  }
});
