import test from "ava";
import {
    string,
    publicKey as publicKeySerializer,
} from '@metaplex-foundation/umi/serializers';
import { generateSigner, publicKey } from "@metaplex-foundation/umi";
import { createFungible } from "@metaplex-foundation/mpl-token-metadata";
import { generateSignerWithSol } from "@metaplex-foundation/umi-bundle-tests";
import { transfer } from "@metaplex-foundation/mpl-core";
import {
    createChecklistV1,
    createRecipeV1,
    withdrawCoreAssetV1,
    fetchRecipeChecklistV1,
    fetchRecipeV1,
    ingredientV1,
    MPL_HYBRID_PROGRAM_ID,
    triggerV1
} from "../../src";
import { createCoreCollection, createUmi } from "../_setup";

test("it can withdraw a core asset", async (t) => {
    const umi = await createUmi();
    const payer = await generateSignerWithSol(umi);
    const { collection, assets } = await createCoreCollection(umi);
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
        string({ size: 'variable' }).serialize('escrow'),
        publicKeySerializer().serialize(collection.publicKey),
    ]);

    await createRecipeV1(umi, {
        recipe,
        reversible: false,
        inputs: [{
            ingredient: ingredientV1("CoreCollection", [collection.publicKey]),
            trigger: triggerV1("None"),
        }],
        outputs: [{
            ingredient: ingredientV1("None"),
            trigger: triggerV1("None"),
        }]
    }).sendAndConfirm(umi);

    t.like(await fetchRecipeV1(umi, recipe), {
        publicKey: publicKey(recipe),
        count: 0n,
        reversible: false,
        bump: recipe[1],
        inputs: [{
            ingredient: ingredientV1("CoreCollection", [collection.publicKey]),
            trigger: triggerV1("None"),
        }],
        outputs: [{
            ingredient: ingredientV1("None"),
            trigger: triggerV1("None"),
        }]
    });

    // Transfer the assets to the escrow.
    // eslint-disable-next-line no-restricted-syntax
    for (const asset of assets) {
        // eslint-disable-next-line no-await-in-loop
        await transfer(umi, {
            asset,
            collection,
            newOwner: recipe,
        }).sendAndConfirm(umi);
    }

    const checklist = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
        string({ size: 'variable' }).serialize('checklist'),
        publicKeySerializer().serialize(recipe),
        publicKeySerializer().serialize(payer.publicKey),
    ]);

    await createChecklistV1(umi, {
        recipe,
        checklist,
        payer,
    }).sendAndConfirm(umi);

    t.like(await fetchRecipeChecklistV1(umi, checklist), {
        publicKey: publicKey(checklist),
        bump: checklist[1],
        inputs: [{
            ingredientChecked: false,
            triggerChecked: true,
        }],
        outputs: [{
            ingredientChecked: true,
            triggerChecked: true,
        }]
    });

    await withdrawCoreAssetV1(umi, {
        recipe,
        checklist,
        asset: assets[0].publicKey,
        collection: collection.publicKey,
        payer,
        reversed: true,
    }).sendAndConfirm(umi);

    t.like(await fetchRecipeChecklistV1(umi, checklist), {
        publicKey: publicKey(checklist),
        bump: checklist[1],
        inputs: [{
            ingredientChecked: true,
            triggerChecked: true,
        }],
        outputs: [{
            ingredientChecked: true,
            triggerChecked: true,
        }]
    });
});