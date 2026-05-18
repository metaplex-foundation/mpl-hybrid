#!/bin/bash

set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
OUTPUT="./programs/.bin"
# go to parent folder
cd "$(dirname "$(dirname "$(dirname "${SCRIPT_DIR}")")")"

if [ -z "${PROGRAMS+x}" ]; then
    PROGRAMS="$(grep "^PROGRAMS=" .github/.env | cut -d '=' -f 2)"
fi

# default to input from the command-line
ARGS=("$@")

# command-line arguments override env variable
if [ ${#ARGS[@]} -gt 0 ]; then
    PROGRAMS="[\"${1}\"]"
    shift
    ARGS=("$@")
fi

# parse the JSON array into a bash array
PROGRAM_LINES="$(
    printf '%s\n' "${PROGRAMS}" |
        jq -cer 'if type == "array" and length > 0 then .[] else error("PROGRAMS must be a non-empty JSON array") end'
)"
PROGRAM_LIST=()
while IFS= read -r program; do
    PROGRAM_LIST+=("${program}")
done <<EOF
${PROGRAM_LINES}
EOF

# creates the output directory if it doesn't exist
mkdir -p "${OUTPUT}"

# Populate external program binaries (mpl_core, token_metadata, etc.) into
# programs/.bin so a clean checkout has everything local-validator and
# integration-test flows expect, even when only `pnpm programs:build` has run.
# `test.sh` also sources this, but running it here keeps the post-build state
# self-contained.
"${SCRIPT_DIR}/dump.sh" "${OUTPUT}"

WORKING_DIR=$(pwd)
BASE_IMAGE_ARGS=()

if [ -n "${SOLANA_VERIFY_BASE_IMAGE:-}" ]; then
    BASE_IMAGE_ARGS=(--base-image "${SOLANA_VERIFY_BASE_IMAGE}")
fi

# Resolve a program directory's `[lib].name` from its Cargo.toml. solana-verify
# builds workspace members by their library name, not the package or directory
# name. We fall back to the conventional `<dir-with-_>` form used in this repo
# so newly-added programs work without extra wiring.
resolve_library_name() {
    local program_dir="$1"
    local cargo_toml="${WORKING_DIR}/programs/${program_dir}/Cargo.toml"
    local lib_name=""

    if [ -f "${cargo_toml}" ]; then
        lib_name=$(awk '
            /^\[lib\]/ { in_lib = 1; next }
            /^\[/      { in_lib = 0 }
            in_lib && /^[[:space:]]*name[[:space:]]*=/ {
                sub(/#.*/, "", $0)
                gsub(/[" ]/, "", $0)
                split($0, parts, "=")
                print parts[2]
                exit
            }
        ' "${cargo_toml}")
    fi

    if [ -z "${lib_name}" ]; then
        lib_name="${program_dir//-/_}"
    fi

    echo "${lib_name}"
}

for p in "${PROGRAM_LIST[@]}"; do
    LIB_NAME=$(resolve_library_name "${p}")
    echo "Building verified program: ${p} (library: ${LIB_NAME})"

    # `solana-verify build` runs the build inside a deterministic docker image
    # so the resulting .so hash matches a remote verification of the same
    # source. The output lands at target/deploy/<lib>.so under the workspace
    # root regardless of which program was selected.
    # ${ARGS[@]+"${ARGS[@]}"} guards against empty-array expansion under
    # `set -u` on Bash < 4.4.
    solana-verify build "${BASE_IMAGE_ARGS[@]}" --library-name "${LIB_NAME}" ${ARGS[@]+"${ARGS[@]}"}

    cp "${WORKING_DIR}/target/deploy/${LIB_NAME}.so" "${WORKING_DIR}/${OUTPUT}/${LIB_NAME}.so"
done
