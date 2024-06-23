/* eslint-disable import/no-extraneous-dependencies */
import { createUmi as basecreateUmi } from '@metaplex-foundation/umi-bundle-tests';
import { AssetV1, create, createCollection, fetchAsset, fetchCollection, mplCore } from '@metaplex-foundation/mpl-core';
import { generateSigner, PublicKey, Umi } from '@metaplex-foundation/umi';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { mplHybrid } from '../src';

export const DEFAULT_ASSET = {
    name: 'Test Asset',
    uri: 'https://example.com/asset',
};

export const DEFAULT_COLLECTION = {
    name: 'Test Collection',
    uri: 'https://example.com/collection',
};

export const createUmi = async () =>
    (await basecreateUmi()).use(mplHybrid()).use(mplCore()).use(mplTokenMetadata());

export async function createCoreCollection(umi: Umi, owner?: PublicKey) {
    const collectionAddress = generateSigner(umi);
    await createCollection(umi, {
        collection: collectionAddress,
        ...DEFAULT_COLLECTION,
    }).sendAndConfirm(umi);

    const collection = await fetchCollection(umi, collectionAddress.publicKey);
    const newOwner = owner || umi.identity.publicKey;

    const assets: AssetV1[] = [];
    for (let i = 0; i < 10; i += 1) {
        const assetAddress = generateSigner(umi);
        // eslint-disable-next-line no-await-in-loop
        await create(umi, {
            asset: assetAddress,
            collection,
            owner: newOwner,
            ...DEFAULT_ASSET,
        }).sendAndConfirm(umi);
        // eslint-disable-next-line no-await-in-loop
        assets.push(await fetchAsset(umi, assetAddress.publicKey));
    }

    return { collection, assets };
}