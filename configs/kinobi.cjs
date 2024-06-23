const path = require("path");
const k = require("@metaplex-foundation/kinobi");

// Paths.
const clientDir = path.join(__dirname, "..", "clients");
const idlDir = path.join(__dirname, "..", "idls");

// Instantiate Kinobi.
const kinobi = k.createFromIdls([
    path.join(idlDir, "mplHybrid.json"),
]);

// Update programs.
kinobi.update(
    k.updateProgramsVisitor({
        mplHybridProgram: { name: "mplHybrid" },
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
        }
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