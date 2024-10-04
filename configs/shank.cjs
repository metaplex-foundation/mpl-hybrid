const path = require("path");
const { generateIdl } = require("@metaplex-foundation/shank-js");

const idlDir = path.join(__dirname, "..", "idls");
const binaryInstallDir = path.join(__dirname, "..", ".crates");
const programDir = path.join(__dirname, "..", "programs");

// This IDL hook sets the authority account as a signer because Anchor does not support the concept of optional signers.
// This is overridden in the Kinobi config file by setting signer to optional so it remains optional in the generated clients.
let idlHook = (idl) => {
    for (const instruction of idl.instructions) {
        if (instruction.name === "captureV1" || instruction.name === "releaseV1" || instruction.name === "captureV2" || instruction.name === "releaseV2") {
            for (const account of instruction.accounts) {
                if (account.name === "authority") {
                    account.isSigner = true;
                }
            }
        }
    }
    return idl;
};

generateIdl({
    generator: "anchor",
    programName: "mpl_hybrid",
    programId: "MPL4o4wMzndgh8T1NVDxELQCj5UQfYTYEkabX3wNKtb",
    idlDir,
    idlName: "mpl_hybrid",
    idlHook,
    binaryInstallDir,
    programDir: path.join(programDir, "mpl-hybrid"),
    rustbin: {
        locked: true,
        versionRangeFallback: "0.27.0",
    },
});