const path = require("path");
const { generateIdl } = require("@metaplex-foundation/shank-js");

const idlDir = path.join(__dirname, "..", "idls");
const binaryInstallDir = path.join(__dirname, "..", ".crates");
const programDir = path.join(__dirname, "..", "programs");

generateIdl({
    generator: "anchor",
    programName: "mpl_hybrid",
    programId: "MPL4o4wMzndgh8T1NVDxELQCj5UQfYTYEkabX3wNKtb",
    idlDir,
    idlName: "mplHybrid",
    binaryInstallDir,
    programDir: path.join(programDir, "mpl-hybrid"),
    rustbin: {
        locked: true,
        versionRangeFallback: "0.27.0",
    },
});