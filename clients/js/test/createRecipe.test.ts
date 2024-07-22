import test from "ava";
import {
    string,
    publicKey as publicKeySerializer,
} from '@metaplex-foundation/umi/serializers';
import { generateSigner, publicKey } from "@metaplex-foundation/umi";
import { createFungible } from "@metaplex-foundation/mpl-token-metadata";
import { createRecipeV1, fetchRecipeV1, ingredientV1, MPL_HYBRID_PROGRAM_ID, triggerV1 } from "../src";
import { createCoreCollection, createUmi } from "./_setup";

test("it can create a recipe", async (t) => {
    const umi = await createUmi();
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
            ingredient: ingredientV1("SplToken", [tokenMint.publicKey, 5]),
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
            ingredient: ingredientV1("SplToken", [tokenMint.publicKey, 5n]),
            trigger: triggerV1("None"),
        }]
    });
});

test("it cannot create a recipe with an invalid PDA", async (t) => {
    const umi = await createUmi();
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

    // const recipe = umi.eddsa.findPda(MPL_HYBRID_PROGRAM_ID, [
    //     string({ size: 'variable' }).serialize('escrow'),
    //     publicKeySerializer().serialize(collection.publicKey),
    // ]);

    const recipe = generateSigner(umi);

    const result = createRecipeV1(umi, {
        recipe: recipe.publicKey,
        reversible: false,
        inputs: [{
            ingredient: ingredientV1("CoreCollection", [collection.publicKey]),
            trigger: triggerV1("None"),
        }],
        outputs: [{
            ingredient: ingredientV1("SplToken", [tokenMint.publicKey, 5]),
            trigger: triggerV1("None"),
        }]
    }).sendAndConfirm(umi);

    await t.throwsAsync(result, { message: /custom program error: 0x7d6./ });
});