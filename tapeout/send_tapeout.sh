#!/usr/bin/env bash
# Tape out ICONIC-GATE on OrderGuard (X Layer mainnet, chain 196).
# Usage: ./send_tapeout.sh          — dry run: prints cost + calldata
#        ./send_tapeout.sh --send   — mints transistors + tapes out + verifies eval
# Key: TAPEOUT_PRIVATE_KEY in ../.env.local (never echoed).
set -euo pipefail

RPC="${TAPEOUT_RPC:-https://rpc.xlayer.tech}"
CHAIN_ID=196
PROCESSOR="0x57F319CF056F72F48cF1dbb670F2A3DB007Aa355"   # OrderGuard
TRANSISTORS="0x8e71FC45ff47E5a7bA1ad2960793ebAdD2739D9e" # OrderGuard transistors (ERC-1155 id 0)
TAPEOUT_FEE_WEI=1300000000000000                            # 0.0013 OKB
MINT_PRICE_WEI=100000000000000                              # 0.0001 OKB / gate
PROTOCOL_FEE_WEI=660000000000000                            # 0.00066 OKB
N_GATES=46
N_IN=14
N_OUT=5
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NL="$(cat "$DIR/netlist.hex")"

CAST="${CAST:-cast}"
[ -x "$HOME/.foundry/bin/cast" ] && CAST="$HOME/.foundry/bin/cast"

cd "$DIR"
# shellcheck disable=SC1091
set -a; source ../.env.local; set +a
: "${TAPEOUT_PRIVATE_KEY:?set TAPEOUT_PRIVATE_KEY in ../.env.local}"
DEPLOYER=$("$CAST" wallet address --private-key "$TAPEOUT_PRIVATE_KEY")
KEYARGS=(--private-key "$TAPEOUT_PRIVATE_KEY")

REAL_CHAIN=$("$CAST" chain-id --rpc-url "$RPC")
[ "$REAL_CHAIN" = "$CHAIN_ID" ] || { echo "ABORT: chain id $REAL_CHAIN != $CHAIN_ID"; exit 1; }
NAME=$("$CAST" call "$PROCESSOR" "name()(string)" --rpc-url "$RPC")
[ "$NAME" = '"OrderGuard"' ] || { echo "ABORT: processor name()=$NAME"; exit 1; }

GATES="$N_GATES"
MINT_NEEDED=$GATES
EXISTING=$("$CAST" call "$TRANSISTORS" "balanceOf(address,uint256)(uint256)" "$DEPLOYER" 0 --rpc-url "$RPC" | grep -oE '^[0-9]+')
MINT_NEEDED=$(( GATES > EXISTING ? GATES - EXISTING : 0 ))
MINT_WEI=$(( MINT_NEEDED * MINT_PRICE_WEI + (MINT_NEEDED > 0 ? PROTOCOL_FEE_WEI : 0) ))
BAL=$("$CAST" balance "$DEPLOYER" --rpc-url "$RPC")
NEEDED_WEI=$(( MINT_WEI + TAPEOUT_FEE_WEI ))
GAS_PRICE=$("$CAST" gas-price --rpc-url "$RPC" | grep -oE '^[0-9]+')
GAS_RESERVE=$(( GAS_PRICE * 600000 ))
TOTAL_WEI=$(( NEEDED_WEI + GAS_RESERVE ))

echo "deployer:    $DEPLOYER"
echo "balance:     $(python3 -c "print($BAL/1e18)") OKB"
echo "transistors: $EXISTING (need $GATES, mint $MINT_NEEDED)"
echo "mint cost:   $(python3 -c "print($MINT_WEI/1e18)") OKB"
echo "tapeout fee: $(python3 -c "print($TAPEOUT_FEE_WEI/1e18)") OKB"
echo "gas reserve: ~$(python3 -c "print($GAS_RESERVE/1e18)") OKB (@ $GAS_PRICE wei)"
echo "TOTAL:       ~$(python3 -c "print($TOTAL_WEI/1e18)") OKB"

if [ "${1:-}" != "--send" ]; then
  echo; echo "Dry run. Fund $DEPLOYER with OKB on X Layer, then re-run with --send."
  exit 0
fi

[ "$BAL" -ge "$TOTAL_WEI" ] || { echo "ABORT: insufficient balance"; exit 1; }
NONCE=$("$CAST" nonce "$DEPLOYER" --rpc-url "$RPC")

if [ "$MINT_NEEDED" -gt 0 ]; then
  echo ">> minting $MINT_NEEDED transistors..."
  "$CAST" send "$TRANSISTORS" "mint(uint256,uint256)" 0 "$MINT_NEEDED" \
    --value "$MINT_WEI" --nonce "$NONCE" --rpc-url "$RPC" "${KEYARGS[@]}" | grep -E "transactionHash|status"
  NONCE=$((NONCE + 1))
fi

echo ">> taping out ICONIC-GATE (46 NAND gates, 14 in, 5 out)..."
"$CAST" send "$PROCESSOR" "tapeout(bytes,uint32,uint32)" "$NL" "$N_IN" "$N_OUT" \
  --value "$TAPEOUT_FEE_WEI" --nonce "$NONCE" --rpc-url "$RPC" "${KEYARGS[@]}" | tee /tmp/tapeout-tx.txt | grep -E "transactionHash|status"
TXHASH=$(grep -oE '0x[0-9a-fA-F]{64}' /tmp/tapeout-tx.txt | head -1)
echo "tx: $TXHASH"

# Parse circuitId from TapedOut event (topic0 0xc11215e4..., topics[1]=circuitId)
sleep 5
CIRCUIT_ID=""
for i in 1 2 3 4 5 6 7 8; do
  R=$("$CAST" receipt "$TXHASH" --rpc-url "$RPC" 2>/dev/null || true)
  CIRCUIT_ID=$(echo "$R" | python3 -c "
import json,sys
try:
  r=json.load(sys.stdin)
  for log in r['logs']:
    if log['topics'][0].lower().startswith('0xc11215e4'):
      print(int(log['topics'][1],16)); break
except Exception: pass
" 2>/dev/null || true)
  [ -n "$CIRCUIT_ID" ] && break
  sleep 3
done
echo "circuitId: ${CIRCUIT_ID:-UNKNOWN}"

# Verify eval on a known vector: minted=1, media=1, rank=2, votes_q=9
# -> promote=1, score=9 -> output word = 0b10011 = 0x13 (out0=promote, out1..4=score)
IBYTES=$(python3 -c "import sys; sys.path.insert(0,'$DIR'); from verify import pack_inputs; print('0x'+pack_inputs(1,1,2,9).hex())")
echo ">> verifying eval($CIRCUIT_ID, inputs=$IBYTES) — expect 0x..13"
"$CAST" call "$PROCESSOR" "eval(uint256,bytes)(bytes)" "$CIRCUIT_ID" "$IBYTES" --rpc-url "$RPC"
echo "Done. Record processor=$PROCESSOR circuitId=$CIRCUIT_ID tx=$TXHASH in tapeout/README.md"
