import test from 'ava';
import { generateSigner, publicKey } from '@metaplex-foundation/umi';
import {
  string,
  publicKey as publicKeySerializer,
} from '@metaplex-foundation/umi/serializers';
import { createFungible } from '@metaplex-foundation/mpl-token-metadata';
import { createCoreCollection, createUmi } from './_setup';
import {
  fetchNftDataV1,
  initNftDataV1,
  MPL_HYBRID_PROGRAM_ID,
  NftDataV1,
  Path,
} from '../src';

test('it can initialize the nft data', async (t) => {
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

  const nftData = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('nft'),
    publicKeySerializer().serialize(assets[0].publicKey),
  ]);

  await initNftDataV1(umi, {
    nftData,
    asset: assets[0].publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com',
    max: 2,
    min: 1,
    amount: 3,
    feeAmount: 4,
    path: Path.RerollMetadata,
    collection: collection.publicKey,
    solFeeAmount: 5,
  }).sendAndConfirm(umi);

  t.like(await fetchNftDataV1(umi, nftData), <NftDataV1>{
    publicKey: publicKey(nftData),
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com',
    max: 2n,
    min: 1n,
    amount: 3n,
    feeAmount: 4n,
    count: 0n,
    path: Path.RerollMetadata,
    bump: nftData[1],
    solFeeAmount: 5n,
  });
});

test('it cannot use an invalid asset', async (t) => {
  // Given a Umi instance using the project's plugin.
  const umi = await createUmi();
  const feeLocation = generateSigner(umi);
  const { collection } = await createCoreCollection(umi);
  const asset = generateSigner(umi);
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

  const nftData = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('nft'),
    publicKeySerializer().serialize(asset.publicKey),
  ]);

  const result = initNftDataV1(umi, {
    nftData,
    asset: asset.publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com',
    max: 2,
    min: 1,
    amount: 3,
    feeAmount: 4,
    path: Path.RerollMetadata,
    collection: collection.publicKey,
    solFeeAmount: 5,
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, { name: 'InvalidAssetAccount' });
});

test('it cannot use an invalid token mint', async (t) => {
  // Given a Umi instance using the project's plugin.
  const umi = await createUmi();
  const feeLocation = generateSigner(umi);
  const { assets, collection } = await createCoreCollection(umi);
  const tokenMint = generateSigner(umi);

  const nftData = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('nft'),
    publicKeySerializer().serialize(assets[0].publicKey),
  ]);

  const result = initNftDataV1(umi, {
    nftData,
    asset: assets[0].publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com',
    max: 2,
    min: 1,
    amount: 3,
    feeAmount: 4,
    path: Path.RerollMetadata,
    collection: collection.publicKey,
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

  const nftData = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    string({ size: 'variable' }).serialize('nft'),
    publicKeySerializer().serialize(assets[0].publicKey),
  ]);

  const result = initNftDataV1(umi, {
    nftData,
    asset: assets[0].publicKey,
    token: tokenMint.publicKey,
    feeLocation: feeLocation.publicKey,
    name: 'Test Escrow',
    uri: 'www.test.com',
    max: 1,
    min: 2,
    amount: 3,
    feeAmount: 4,
    path: Path.RerollMetadata,
    collection: collection.publicKey,
    solFeeAmount: 5,
  }).sendAndConfirm(umi);

  await t.throwsAsync(result, { name: 'MaxMustBeGreaterThanMin' });
});
