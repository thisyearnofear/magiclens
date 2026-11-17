#!/usr/bin/env python3
"""Build the ICONIC-GATE NAND2 netlist in TapeOut on-chain format.

Wire numbering (on-chain): 0 = const ZERO, 1 = const ONE,
inputs in0..in13 = wires 2..15, gate i output = 16 + i.
Each gate: opcode 0x00 + u24 a + u24 b (7 bytes, big-endian).
Outputs must be the LAST nOut gate signals, in tap order.

Run: python3 build_netlist.py  -> writes netlist.hex, verifies exhaustively.
"""
from verify import ref, pack_inputs

N_IN = 14
N_OUT = 5
N_BASE = 2 + N_IN  # first gate output wire = 16

# Input indices (see README.md)
I_MINTED, I_MEDIA = 0, 1
I_RANK = list(range(2, 6))      # r0..r3, r0 = LSB
I_VOTES = list(range(6, 14))    # v0..v7, v0 = LSB


class Builder:
    def __init__(self):
        self.gates = []          # list of (a, b) wire ids
        self._not = {}

    def wire_in(self, i):
        return 2 + i

    def g(self, a, b):
        self.gates.append((a, b))
        return N_BASE + len(self.gates) - 1

    def NOT(self, x):
        # NAND(x,x) = ~x — a single gate
        if x not in self._not:
            self._not[x] = self.g(x, x)
        return self._not[x]

    def AND(self, a, b):
        t = self.g(a, b)          # ~(a&b)
        return self.g(t, t)       # a&b

    def OR(self, a, b):
        return self.g(self.NOT(a), self.NOT(b))

    def ORN(self, xs):
        # balanced OR tree
        while len(xs) > 1:
            nxt = []
            for i in range(0, len(xs) - 1, 2):
                nxt.append(self.OR(xs[i], xs[i + 1]))
            if len(xs) % 2:
                nxt.append(xs[-1])
            xs = nxt
        return xs[0]

    def ANDN(self, xs):
        while len(xs) > 1:
            nxt = []
            for i in range(0, len(xs) - 1, 2):
                nxt.append(self.AND(xs[i], xs[i + 1]))
            if len(xs) % 2:
                nxt.append(xs[-1])
            xs = nxt
        return xs[0]


def simulate(gates, n_in, inputs):
    """inputs: int bitmask, in0 = bit0. Returns list of all wire values."""
    n_base = 2 + n_in
    val = [0] * (n_base + len(gates))
    for i in range(n_in):
        val[2 + i] = (inputs >> i) & 1
    for i, (a, b) in enumerate(gates):
        val[n_base + i] = 1 - (val[a] & val[b])
    return val


def main():
    b = Builder()

    minted = b.wire_in(I_MINTED)
    media = b.wire_in(I_MEDIA)
    r = [b.wire_in(i) for i in I_RANK]      # r[0]=r0 LSB
    v = [b.wire_in(i) for i in I_VOTES]     # v[0]=v0 LSB

    # rank_top3 = ~(r3|r2) & (r1|r0)   (rank in 1..3)
    hi = b.ORN([r[3], r[2]])
    top3_hi_off = b.NOT(hi)                # r3=0 & r2=0
    lo = b.ORN([r[1], r[0]])               # rank >= 1 (within low half)
    rank_top3 = b.AND(top3_hi_off, lo)

    # votes_nonzero = OR(v0..v7)
    votes_nonzero = b.ORN(v)

    # score_hi = OR(v4..v7)  (votes_q >= 16)
    score_hi = b.ORN(v[4:])
    n_score_hi = b.NOT(score_hi)           # shared by all 4 score bits
    n_v_lo = [b.NOT(x) for x in v[:4]]     # NOT(v0..v3) for score bits

    # partial promote terms (everything except the final AND)
    m_and_md = b.AND(minted, media)
    promote_partial = b.AND(m_and_md, rank_top3)

    # ── tail: last 5 gates must be outputs [promote, s0, s1, s2, s3] ──
    # promote = promote_partial & votes_nonzero  (AND = 2 gates)
    t = b.g(promote_partial, votes_nonzero)
    promote = b.g(t, t)                     # gate index G-5

    # score_i = score_hi | v_i = NAND(NOT score_hi, NOT v_i)
    score_bits = [b.g(n_score_hi, n_v_lo[i]) for i in range(4)]  # G-4..G-1

    gates = b.gates
    n_gates = len(gates)
    assert n_gates >= N_OUT

    # Output wires = last N_OUT gate signals
    out_wires = [N_BASE + n_gates - N_OUT + i for i in range(N_OUT)]
    assert out_wires[0] == promote and out_wires[1:] == score_bits

    # Depth + cost
    depth = [0] * (N_BASE + n_gates)
    for i, (a, bb) in enumerate(gates):
        depth[N_BASE + i] = 1 + max(depth[a], depth[bb])
    d = max(depth[w] for w in out_wires)
    cost = n_gates * d ** 3

    # ── exhaustive verification vs reference ──
    bad = []
    for inputs in range(1 << N_IN):
        val = simulate(gates, N_IN, inputs)
        out_word = sum(val[w] << i for i, w in enumerate(out_wires))
        p_ref, s_ref = ref(inputs & 1, (inputs >> 1) & 1,
                           (inputs >> 2) & 0xF, (inputs >> 6) & 0xFF)
        p_got = out_word & 1
        s_got = (out_word >> 1) & 0xF
        if (p_got, s_got) != (p_ref, s_ref):
            bad.append((inputs, (p_got, s_got), (p_ref, s_ref)))
            if len(bad) > 5:
                break
    if bad:
        print("MISMATCH:", bad[:5])
        raise SystemExit(1)
    print(f"verified: {1 << N_IN} cases, 0 mismatches")

    # ── emit nl_hex ──
    nl = bytearray()
    for a, bb in gates:
        nl.append(0x00)
        nl += a.to_bytes(3, "big") + bb.to_bytes(3, "big")
    assert len(nl) == n_gates * 7

    with open("netlist.hex", "w") as f:
        f.write("0x" + nl.hex() + "\n")

    print(f"nIn={N_IN} nOut={N_OUT} gates={n_gates} depth={d} cost={cost}")
    print(f"nl_len={len(nl)} bytes -> netlist.hex")
    print(f"sample eval inputs for (minted=1,media=1,rank=2,votes=150): {pack_inputs(1,1,2,150).hex()}")


if __name__ == "__main__":
    main()
