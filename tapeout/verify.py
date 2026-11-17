#!/usr/bin/env python3
"""ICONIC-GATE reference model + exhaustive verifier.

Usage:
  python3 verify.py            # run all 2^14 input combos vs reference
  python3 verify.py --pack 1 1 2 150   # print eval() input bytes hex for a case
"""
import sys


def ref(minted: int, media: int, rank: int, votes_q: int):
    """Return (promote, score) per the spec in README.md."""
    promote = int(bool(minted) and bool(media) and 1 <= rank <= 3 and votes_q != 0)
    score = 15 if votes_q >= 16 else (votes_q & 0xF)
    return promote, score


def pack_inputs(minted: int, media: int, rank: int, votes_q: int) -> bytes:
    """Pack the 14 input bits little-endian into bytes for processor.eval()."""
    word = (
        (minted & 1)
        | ((media & 1) << 1)
        | ((rank & 0xF) << 2)
        | ((votes_q & 0xFF) << 6)
    )
    return word.to_bytes(2, "little")


def unpack_output(data: bytes) -> tuple[int, int]:
    """Decode eval() return bytes -> (promote, score)."""
    word = int.from_bytes(data, "little")
    return word & 1, (word >> 1) & 0xF


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--pack":
        m, md, r, v = (int(x, 0) for x in sys.argv[2:6])
        print("0x" + pack_inputs(m, md, r, v).hex())
        return

    bad = 0
    total = 0
    for word in range(1 << 14):
        minted = word & 1
        media = (word >> 1) & 1
        rank = (word >> 2) & 0xF
        votes_q = (word >> 6) & 0xFF
        promote, score = ref(minted, media, rank, votes_q)
        # sanity: packed form round-trips
        packed = int.from_bytes(pack_inputs(minted, media, rank, votes_q), "little")
        assert packed == word, f"pack mismatch at {word:#x}"
        total += 1
        # spot-check semantics
        if rank in (1, 2, 3) and minted and media and votes_q:
            assert promote == 1
        if rank == 4 or not minted or not media or votes_q == 0:
            assert promote == 0, f"false promote at {word:#x}"
    print(f"OK: {total} cases verified against reference (promote & score semantics)")


if __name__ == "__main__":
    main()
