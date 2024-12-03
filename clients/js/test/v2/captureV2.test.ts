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
import {
  addCollectionPlugin,
  fetchAsset,
  transfer,
} from '@metaplex-foundation/mpl-core';
import {
  buildPath,
  captureV2,
  EscrowV2,
  fetchEscrowV2,
  fetchRecipeV1,
  initEscrowV2,
  initRecipeV1,
  MPL_HYBRID_PROGRAM_ID,
  Path,
} from '../../src';
import { createCoreCollection, createUmi } from '../_setup';

test('it can swap tokens for an asset with reroll', async (t) => {
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

  await initEscrowV2(umi, {}).sendAndConfirm(umi);

  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('escrow'),
    publicKeySerializer().serialize(umi.identity.publicKey),
  ]);

  t.like(await fetchEscrowV2(umi, escrow), <EscrowV2>{
    authority: umi.identity.publicKey,
    bump: escrow[1],
  });

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

  const recipe = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('recipe'),
    publicKeySerializer().serialize(collection.publicKey),
  ]);

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
    feeAmountRelease: 1,
    solFeeAmountCapture: 890_880n,
    solFeeAmountRelease: 100_000n,
    path: buildPath([Path.RerollMetadata]),
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
    feeAmountRelease: 1n,
    solFeeAmountCapture: 890_880n,
    solFeeAmountRelease: 100_000n,
    count: 1n,
    path: buildPath([Path.RerollMetadata]),
    bump: recipe[1],
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

  await captureV2(umi, {
    owner: umi.identity,
    authority: umi.identity,
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
    feeLocation.publicKey
  );
  t.deepEqual(feeTokenAfter.token.amount, 1n);
  const assetAfter = await fetchAsset(umi, assets[0].publicKey);
  t.is(assetAfter.owner, umi.identity.publicKey);

  // Use a Regex to check the URI
  const uriRegex = new RegExp(`${recipeData.uri}\\d+\\.json`);
  t.regex(assetAfter.uri, uriRegex);
});

test('it can swap tokens for an asset without reroll', async (t) => {
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

  await initEscrowV2(umi, {}).sendAndConfirm(umi);

  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('escrow'),
    publicKeySerializer().serialize(umi.identity.publicKey),
  ]);

  t.like(await fetchEscrowV2(umi, escrow), <EscrowV2>{
    authority: umi.identity.publicKey,
    bump: escrow[1],
  });

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

  const recipe = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('recipe'),
    publicKeySerializer().serialize(collection.publicKey),
  ]);

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
    feeAmountRelease: 1,
    solFeeAmountCapture: 890_880n,
    solFeeAmountRelease: 100_000n,
    path: buildPath([Path.NoRerollMetadata]),
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
    feeAmountRelease: 1n,
    solFeeAmountCapture: 890_880n,
    solFeeAmountRelease: 100_000n,
    count: 1n,
    path: buildPath([Path.NoRerollMetadata]),
    bump: recipe[1],
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

  await captureV2(umi, {
    owner: umi.identity,
    authority: umi.identity,
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
    feeLocation.publicKey
  );
  t.deepEqual(feeTokenAfter.token.amount, 1n);
  const assetAfter = await fetchAsset(umi, assets[0].publicKey);
  t.is(assetAfter.owner, umi.identity.publicKey);

  // Make sure the URI has not changed.
  t.is(assetAfter.uri, 'https://example.com/asset');
});

test('it can swap tokens for an asset as UpdateDelegate with reroll', async (t) => {
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

  await initEscrowV2(umi, {}).sendAndConfirm(umi);

  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('escrow'),
    publicKeySerializer().serialize(umi.identity.publicKey),
  ]);

  t.like(await fetchEscrowV2(umi, escrow), <EscrowV2>{
    authority: umi.identity.publicKey,
    bump: escrow[1],
  });

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

  const recipe = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('recipe'),
    publicKeySerializer().serialize(collection.publicKey),
  ]);

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
    feeAmountRelease: 1,
    solFeeAmountCapture: 890_880n,
    solFeeAmountRelease: 100_000n,
    path: buildPath([Path.RerollMetadata]),
  }).sendAndConfirm(umi);

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
    feeAmountRelease: 1n,
    solFeeAmountCapture: 890_880n,
    solFeeAmountRelease: 100_000n,
    count: 1n,
    path: buildPath([Path.RerollMetadata]),
    bump: recipe[1],
  });

  await captureV2(umi, {
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
    feeLocation.publicKey
  );
  t.deepEqual(feeTokenAfter.token.amount, 1n);
  const assetAfter = await fetchAsset(umi, assets[0].publicKey);
  t.is(assetAfter.owner, umi.identity.publicKey);

  // Use a Regex to check the URI
  const uriRegex = new RegExp(`${recipeData.uri}\\d+\\.json`);
  t.regex(assetAfter.uri, uriRegex);
});

test('it can swap tokens for an asset as UpdateDelegate without reroll', async (t) => {
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

  await initEscrowV2(umi, {}).sendAndConfirm(umi);

  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('escrow'),
    publicKeySerializer().serialize(umi.identity.publicKey),
  ]);

  t.like(await fetchEscrowV2(umi, escrow), <EscrowV2>{
    authority: umi.identity.publicKey,
    bump: escrow[1],
  });

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

  const recipe = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('recipe'),
    publicKeySerializer().serialize(collection.publicKey),
  ]);

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
    feeAmountRelease: 1,
    solFeeAmountCapture: 890_880n,
    solFeeAmountRelease: 100_000n,
    path: buildPath([Path.NoRerollMetadata]),
  }).sendAndConfirm(umi);

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
    feeAmountRelease: 1n,
    solFeeAmountCapture: 890_880n,
    solFeeAmountRelease: 100_000n,
    count: 1n,
    path: buildPath([Path.NoRerollMetadata]),
    bump: recipe[1],
  });

  await captureV2(umi, {
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
    feeLocation.publicKey
  );
  t.deepEqual(feeTokenAfter.token.amount, 1n);
  const assetAfter = await fetchAsset(umi, assets[0].publicKey);
  t.is(assetAfter.owner, umi.identity.publicKey);

  // Make sure the URI has not changed.
  t.is(assetAfter.uri, 'https://example.com/asset');
});

test('it cannot swap tokens for an asset with BlockCapture', async (t) => {
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

  await initEscrowV2(umi, {}).sendAndConfirm(umi);

  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('escrow'),
    publicKeySerializer().serialize(umi.identity.publicKey),
  ]);

  t.like(await fetchEscrowV2(umi, escrow), <EscrowV2>{
    authority: umi.identity.publicKey,
    bump: escrow[1],
  });

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

  const recipe = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('recipe'),
    publicKeySerializer().serialize(collection.publicKey),
  ]);

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
    feeAmountRelease: 1,
    solFeeAmountCapture: 890_880n,
    solFeeAmountRelease: 100_000n,
    path: buildPath([Path.NoRerollMetadata, Path.BlockCapture]),
  }).sendAndConfirm(umi);

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
    feeAmountRelease: 1n,
    solFeeAmountCapture: 890_880n,
    solFeeAmountRelease: 100_000n,
    count: 1n,
    path: buildPath([Path.NoRerollMetadata, Path.BlockCapture]),
    bump: recipe[1],
  });

  const result = captureV2(umi, {
    owner: umi.identity,
    authority: recipe,
    recipe,
    escrow,
    asset: assets[0].publicKey,
    collection: collection.publicKey,
    feeProjectAccount: feeLocation.publicKey,
    token: tokenMint.publicKey,
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, { name: 'CaptureBlocked' });
});

test('it can burn tokens for an asset with BurnOnCapture', async (t) => {
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

  await initEscrowV2(umi, {}).sendAndConfirm(umi);

  const escrow = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('escrow'),
    publicKeySerializer().serialize(umi.identity.publicKey),
  ]);

  t.like(await fetchEscrowV2(umi, escrow), <EscrowV2>{
    authority: umi.identity.publicKey,
    bump: escrow[1],
  });

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

  const recipe = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('recipe'),
    publicKeySerializer().serialize(collection.publicKey),
  ]);

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
    feeAmountRelease: 1,
    solFeeAmountCapture: 890_880n,
    solFeeAmountRelease: 100_000n,
    path: buildPath([Path.NoRerollMetadata, Path.BurnOnCapture]),
  }).sendAndConfirm(umi);

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
    feeAmountRelease: 1n,
    solFeeAmountCapture: 890_880n,
    solFeeAmountRelease: 100_000n,
    count: 1n,
    path: buildPath([Path.NoRerollMetadata, Path.BurnOnCapture]),
    bump: recipe[1],
  });

  await captureV2(umi, {
    owner: umi.identity,
    authority: recipe,
    recipe,
    escrow,
    asset: assets[0].publicKey,
    collection: collection.publicKey,
    feeProjectAccount: feeLocation.publicKey,
    token: tokenMint.publicKey,
  }).sendAndConfirm(umi, { send: { skipPreflight: true } });

  const escrowTokenAfter = await fetchDigitalAssetWithAssociatedToken(
    umi,
    tokenMint.publicKey,
    publicKey(escrow)
  );
  // The tokens are burned so the amount should still be 0.
  t.deepEqual(escrowTokenAfter.token.amount, 0n);
  const userTokenAfter = await fetchDigitalAssetWithAssociatedToken(
    umi,
    tokenMint.publicKey,
    umi.identity.publicKey
  );
  t.deepEqual(userTokenAfter.token.amount, 994n);
  const feeTokenAfter = await fetchDigitalAssetWithAssociatedToken(
    umi,
    tokenMint.publicKey,
    feeLocation.publicKey
  );
  t.deepEqual(feeTokenAfter.token.amount, 1n);
  const assetAfter = await fetchAsset(umi, assets[0].publicKey);
  t.is(assetAfter.owner, umi.identity.publicKey);

  // Make sure the URI has not changed.
  t.is(assetAfter.uri, 'https://example.com/asset');
});
