import test from 'ava';
import { generateSigner, publicKey } from '@metaplex-foundation/umi';
import {
  string,
  publicKey as publicKeySerializer,
} from '@metaplex-foundation/umi/serializers';
import { createFungible } from '@metaplex-foundation/mpl-token-metadata';
import { createCoreCollection, createUmi } from '../_setup';
import {
  buildPath,
  fetchRecipeV1,
  initRecipeV1,
  MPL_HYBRID_PROGRAM_ID,
  Path,
} from '../../src';

test('it can initialize the recipe', async (t) => {
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
    max: 2,
    min: 1,
    amount: 3,
    feeAmountCapture: 4,
    feeAmountRelease: 6,
    solFeeAmountCapture: 7,
    solFeeAmountRelease: 8,
    path: buildPath([Path.RerollMetadata]),
  }).sendAndConfirm(umi);

  t.like(await fetchRecipeV1(umi, recipe), {
    publicKey: publicKey(recipe),
    collection: collection.publicKey,
    authority: umi.identity.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 2n,
    min: 1n,
    amount: 3n,
    feeAmountCapture: 4n,
    feeAmountRelease: 6n,
    solFeeAmountCapture: 7n,
    solFeeAmountRelease: 8n,
    count: 1n,
    path: buildPath([Path.RerollMetadata]),
    bump: recipe[1],
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

  const result = initRecipeV1(umi, {
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 2,
    min: 1,
    amount: 3,
    feeAmountCapture: 4,
    feeAmountRelease: 6,
    solFeeAmountCapture: 7,
    solFeeAmountRelease: 8,
    path: buildPath([Path.RerollMetadata]),
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, { name: 'InvalidCollectionAccount' });
});

test('it cannot use an invalid token mint', async (t) => {
  // Given a Umi instance using the project's plugin.
  const umi = await createUmi();
  const feeLocation = generateSigner(umi);
  const { collection } = await createCoreCollection(umi);
  const tokenMint = generateSigner(umi);

  const result = initRecipeV1(umi, {
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 2,
    min: 1,
    amount: 3,
    feeAmountCapture: 4,
    feeAmountRelease: 6,
    solFeeAmountCapture: 7,
    solFeeAmountRelease: 8,
    path: buildPath([Path.RerollMetadata]),
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

  const result = initRecipeV1(umi, {
    collection: collection.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 1,
    min: 2,
    amount: 3,
    feeAmountCapture: 4,
    feeAmountRelease: 6,
    solFeeAmountCapture: 7,
    solFeeAmountRelease: 8,
    path: buildPath([Path.RerollMetadata]),
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, { name: 'MaxMustBeGreaterThanMin' });
});

test('it can initialize the recipe with reroll v2', async (t) => {
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
    max: 2,
    min: 1,
    amount: 3,
    feeAmountCapture: 4,
    feeAmountRelease: 6,
    solFeeAmountCapture: 7,
    solFeeAmountRelease: 8,
    path: buildPath([Path.RerollMetadataV2]),
  }).sendAndConfirm(umi);

  t.like(await fetchRecipeV1(umi, recipe), {
    publicKey: publicKey(recipe),
    collection: collection.publicKey,
    authority: umi.identity.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com/',
    max: 2n,
    min: 1n,
    amount: 3n,
    feeAmountCapture: 4n,
    feeAmountRelease: 6n,
    solFeeAmountCapture: 7n,
    solFeeAmountRelease: 8n,
    count: 1n,
    path: buildPath([Path.RerollMetadataV2]),
    bump: recipe[1],
  });

  const account = await umi.rpc.getAccount(publicKey(recipe));
  if (account.exists) {
    // The size of the account is the base recipe size + name and URI size + the 2 bytes needed to track 10 NFTs.
    t.is(account.data.length, 211 + 24 + 2);
    // The last two bytes are 0.
    t.is(account.data[235], 0);
    t.is(account.data[236], 0);
  } else {
    t.fail('Account should exist');
  }
});
