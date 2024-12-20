import { fetchAsset, transfer } from '@metaplex-foundation/mpl-core';
import {
  createFungible,
  fetchDigitalAssetWithAssociatedToken,
  mintV1,
  TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata';
import { generateSigner, publicKey } from '@metaplex-foundation/umi';
import {
  publicKey as publicKeySerializer,
  string,
} from '@metaplex-foundation/umi/serializers';
import test from 'ava';
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
  updateRecipeV1,
} from '../../src';
import { createCoreCollection, createUmi } from '../_setup';

test('it can update a recipe basic data', async (t) => {
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

  await updateRecipeV1(umi, {
    recipe,
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow Updated',
    uri: 'www.test.com/updated',
    max: 20n,
    min: 0n,
    amount: 10n,
    feeAmountCapture: 2,
    feeAmountRelease: 2,
    solFeeAmountCapture: 990_880n,
    solFeeAmountRelease: 200_000n,
    path: buildPath([Path.NoRerollMetadata]),
  }).sendAndConfirm(umi);

  const updatedRecipeData = await fetchRecipeV1(umi, recipe);
  t.like(updatedRecipeData, {
    publicKey: publicKey(recipe),
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow Updated',
    uri: 'www.test.com/updated',
    max: 20n,
    min: 0n,
    amount: 10n,
    feeAmountCapture: 2n,
    feeAmountRelease: 2n,
    solFeeAmountCapture: 990_880n,
    solFeeAmountRelease: 200_000n,
    count: 1n,
    path: buildPath([Path.NoRerollMetadata]),
    bump: recipe[1],
  });
});

// recipe swap count is set at a starting value of 1 during recipe init. 1 === no swap
test('it can update a recipe path if recipe swap count === 1', async (t) => {
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

  await updateRecipeV1(umi, {
    recipe,
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

  const updatedRecipeData = await fetchRecipeV1(umi, recipe);
  t.like(updatedRecipeData, {
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
});

// recipe swap count is set at a starting value of 1 during recipe init. 1 === no swap
test('it fails to update a recipe path if recipe swap count > 1', async (t) => {
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

  const result = updateRecipeV1(umi, {
    recipe,
    collection: collection.publicKey,
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
    path: buildPath([Path.NoRerollMetadata]),
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, { name: 'PathCannotBeSet' });
});
