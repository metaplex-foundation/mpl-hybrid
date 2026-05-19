#!/bin/bash

set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
ROOT_DIR=$(dirname "$(dirname "$(dirname "${SCRIPT_DIR}")")")

fail() {
    echo "error: $*" >&2
    exit 1
}

assert_file_exists() {
    local file="$1"

    [ -f "${ROOT_DIR}/${file}" ] || fail "expected ${file} to exist"
}

assert_executable() {
    local file="$1"

    [ -x "${ROOT_DIR}/${file}" ] || fail "expected ${file} to be executable"
}

assert_contains() {
    local file="$1"
    local pattern="$2"
    local description="$3"

    grep -Eq -- "${pattern}" "${ROOT_DIR}/${file}" || fail "expected ${file} to contain ${description}"
}

assert_order() {
    local file="$1"
    local first="$2"
    local second="$3"
    local description="$4"
    local first_line
    local second_line

    first_line=$(grep -n -- "${first}" "${ROOT_DIR}/${file}" | head -n 1 | cut -d: -f1)
    second_line=$(grep -n -- "${second}" "${ROOT_DIR}/${file}" | head -n 1 | cut -d: -f1)

    if [ -z "${first_line}" ] || [ -z "${second_line}" ] || [ "${first_line}" -ge "${second_line}" ]; then
        fail "expected ${file} to order ${description}"
    fi
}

assert_file_exists ".github/workflows/verify-program.yml"
assert_file_exists "configs/scripts/program/verify-from-repo.sh"
assert_executable "configs/scripts/program/verify-from-repo.sh"

bash -n "${ROOT_DIR}/configs/scripts/program/build.sh"
bash -n "${ROOT_DIR}/configs/scripts/program/verify-from-repo.sh"

assert_contains ".github/.env" "^SOLANA_VERIFY_VERSION=" "a pinned solana-verify version"
assert_contains ".github/.env" "^SOLANA_VERIFY_RUST_VERSION=" "a pinned solana-verify Rust version"
assert_contains ".github/.env" "^SOLANA_VERIFY_BASE_IMAGE=" "a pinned solana-verify base image"
assert_contains "configs/scripts/program/build.sh" "solana-verify build" "deterministic solana-verify builds"
assert_contains "configs/scripts/program/build.sh" "--base-image" "base image forwarding"
assert_contains "configs/scripts/program/verify-from-repo.sh" "LIBRARY_NAME=\"mpl_hybrid\"" "Hybrid library default"
assert_contains "configs/scripts/program/verify-from-repo.sh" "MOUNT_PATH=\"\\.\"" "Hybrid workspace mount default"
assert_contains "package.json" "\"programs:verify\"" "program verification npm script"
assert_contains ".github/workflows/build-programs.yml" "rustup toolchain install \"\\$\\{SOLANA_VERIFY_RUST_VERSION\\}\"" "build verified Rust toolchain install"
assert_contains ".github/workflows/build-programs.yml" "cargo \"\\+\\$\\{SOLANA_VERIFY_RUST_VERSION\\}\" install solana-verify" "build verified cargo install"
assert_contains ".github/workflows/deploy-program.yml" "rustup toolchain install \"\\$\\{SOLANA_VERIFY_RUST_VERSION\\}\"" "deploy verified Rust toolchain install"
assert_contains ".github/workflows/deploy-program.yml" "cargo \"\\+\\$\\{SOLANA_VERIFY_RUST_VERSION\\}\" install solana-verify" "deploy verified cargo install"
assert_contains ".github/workflows/verify-program.yml" "rustup toolchain install \"\\$\\{SOLANA_VERIFY_RUST_VERSION\\}\"" "manual verify Rust toolchain install"
assert_contains ".github/workflows/verify-program.yml" "cargo \"\\+\\$\\{SOLANA_VERIFY_RUST_VERSION\\}\" install solana-verify" "manual verify cargo install"
assert_contains ".github/workflows/deploy-program.yml" "Initialize Solana CLI config for solana-verify" "deploy CLI config initialization"
assert_contains ".github/workflows/verify-program.yml" "Initialize Solana CLI config for solana-verify" "manual verify CLI config initialization"
assert_contains ".github/workflows/deploy-program.yml" "solana-verify remote submit-job" "deploy remote verification job submission"
assert_contains ".github/workflows/verify-program.yml" "solana-verify remote submit-job" "manual remote verification job submission"
assert_order ".github/workflows/deploy-program.yml" "Initialize Solana CLI config for solana-verify" "Upload verified-build PDA" "CLI config before deploy PDA upload"
assert_order ".github/workflows/verify-program.yml" "Initialize Solana CLI config for solana-verify" "Upload verified-build PDA" "CLI config before manual PDA upload"
