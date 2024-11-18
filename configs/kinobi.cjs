const path = require("path");
const k = require("@metaplex-foundation/kinobi");

// Paths.
const clientDir = path.join(__dirname, "..", "clients");
const idlDir = path.join(__dirname, "..", "idls");

// Instantiate Kinobi.
const kinobi = k.createFromIdls([
    path.join(idlDir, "mpl_hybrid.json"),
]);

// Update programs.
kinobi.update(
    k.updateProgramsVisitor({
        mplHybridProgram: { name: "mplHybrid" },
    })
);

// Update Accounts.
kinobi.update(
    k.updateAccountsVisitor({
        escrowV1: {
            seeds: [
                k.constantPdaSeedNodeFromString("escrow"),
                k.variablePdaSeedNode(
                    "collection",
                    k.publicKeyTypeNode(),
                    "The address of the collection"
                ),
            ],
        },
        escrowV2: {
            seeds: [
                k.constantPdaSeedNodeFromString("escrow"),
                k.variablePdaSeedNode(
                    "authority",
                    k.publicKeyTypeNode(),
                    "The address of the authority"
                ),
            ],
        },
        recipeV1: {
            seeds: [
                k.constantPdaSeedNodeFromString("recipe"),
                k.variablePdaSeedNode(
                    "collection",
                    k.publicKeyTypeNode(),
                    "The address of the collection"
                ),
            ],
        },
    })
);

// Update Instructions.
const ataPdaDefault = (mint = "mint", owner = "owner") =>
    k.pdaValueNode(k.pdaLinkNode("associatedToken", "mplToolbox"), [
        k.pdaSeedValueNode("mint", k.accountValueNode(mint)),
        k.pdaSeedValueNode("owner", k.accountValueNode(owner))
    ]);

kinobi.update(
    k.updateInstructionsVisitor({
        initEscrowV1: {
            accounts: {
                feeAta: { defaultValue: ataPdaDefault("token", "feeLocation") },
                associatedTokenProgram: {
                    defaultValue: k.publicKeyValueNode("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
                }
            }
        },
        captureV1: {
            accounts: {
                authority: { isSigner: 'either' },
                feeTokenAccount: { defaultValue: ataPdaDefault("token", "feeProjectAccount") },
                escrowTokenAccount: { defaultValue: ataPdaDefault("token", "escrow") },
                userTokenAccount: { defaultValue: ataPdaDefault("token", "owner") },
                associatedTokenProgram: {
                    defaultValue: k.publicKeyValueNode("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
                },
                mplCore: { defaultValue: k.publicKeyValueNode("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d") },
                recentBlockhashes: { defaultValue: k.publicKeyValueNode("SysvarS1otHashes111111111111111111111111111") },
                feeSolAccount: { defaultValue: k.publicKeyValueNode("GjF4LqmEhV33riVyAwHwiEeAHx4XXFn2yMY3fmMigoP3") }
            }
        },
        releaseV1: {
            accounts: {
                authority: { isSigner: 'either' },
                feeTokenAccount: { defaultValue: ataPdaDefault("token", "feeProjectAccount") },
                escrowTokenAccount: { defaultValue: ataPdaDefault("token", "escrow") },
                userTokenAccount: { defaultValue: ataPdaDefault("token", "owner") },
                associatedTokenProgram: {
                    defaultValue: k.publicKeyValueNode("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
                },
                mplCore: { defaultValue: k.publicKeyValueNode("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d") },
                recentBlockhashes: { defaultValue: k.publicKeyValueNode("SysvarS1otHashes111111111111111111111111111") },
                feeSolAccount: { defaultValue: k.publicKeyValueNode("GjF4LqmEhV33riVyAwHwiEeAHx4XXFn2yMY3fmMigoP3") }
            }
        },
        initEscrowV2: {
            accounts: {
                escrow: {
                    defaultValue: k.pdaValueNode("escrowV2")
                },
            }
        },
        initRecipeV1: {
            accounts: {
                recipe: { defaultValue: k.pdaValueNode("recipeV1") },
                feeAta: { defaultValue: ataPdaDefault("token", "feeLocation") },
                associatedTokenProgram: {
                    defaultValue: k.publicKeyValueNode("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
                }
            }
        },
        captureV2: {
            accounts: {
                authority: { isSigner: 'either' },
                feeTokenAccount: { defaultValue: ataPdaDefault("token", "feeProjectAccount") },
                escrowTokenAccount: { defaultValue: ataPdaDefault("token", "escrow") },
                userTokenAccount: { defaultValue: ataPdaDefault("token", "owner") },
                associatedTokenProgram: {
                    defaultValue: k.publicKeyValueNode("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
                },
                mplCore: { defaultValue: k.publicKeyValueNode("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d") },
                recentBlockhashes: { defaultValue: k.publicKeyValueNode("SysvarS1otHashes111111111111111111111111111") },
                feeSolAccount: { defaultValue: k.publicKeyValueNode("GjF4LqmEhV33riVyAwHwiEeAHx4XXFn2yMY3fmMigoP3") }
            }
        },
        releaseV2: {
            accounts: {
                authority: { isSigner: 'either' },
                feeTokenAccount: { defaultValue: ataPdaDefault("token", "feeProjectAccount") },
                escrowTokenAccount: { defaultValue: ataPdaDefault("token", "escrow") },
                userTokenAccount: { defaultValue: ataPdaDefault("token", "owner") },
                associatedTokenProgram: {
                    defaultValue: k.publicKeyValueNode("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
                },
                mplCore: { defaultValue: k.publicKeyValueNode("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d") },
                recentBlockhashes: { defaultValue: k.publicKeyValueNode("SysvarS1otHashes111111111111111111111111111") },
                feeSolAccount: { defaultValue: k.publicKeyValueNode("GjF4LqmEhV33riVyAwHwiEeAHx4XXFn2yMY3fmMigoP3") }
            }
        },
    })
);

// Render Rust.
const crateDir = path.join(clientDir, "rust");
const rustDir = path.join(clientDir, "rust", "src", "generated");
kinobi.accept(
    k.renderRustVisitor(rustDir, {
        formatCode: true,
        crateFolder: crateDir,
    })
);

// Render JavaScript.
const jsDir = path.join(clientDir, "js", "src", "generated");
const prettier = require(path.join(clientDir, "js", ".prettierrc.json"));
kinobi.accept(k.renderJavaScriptVisitor(jsDir, {
    prettier,
    internalNodes: [],
}));