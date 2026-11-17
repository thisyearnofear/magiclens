// ICONIC-GATE — MagicLens promotion judge (TapeOut Accelerate)
// See README.md for the I/O map. Synthesized to NAND-only for tapeout.
module iconic_gate (
  input  wire       minted,
  input  wire       media,
  input  wire [3:0] rank,
  input  wire [7:0] votes_q,
  output wire       promote,
  output wire [3:0] score
);
  wire rank_top3    = (rank >= 4'd1) && (rank <= 4'd3);
  wire votes_nonzero = |votes_q;
  wire score_hi     = (votes_q >= 8'd16);

  assign promote = minted & media & rank_top3 & votes_nonzero;
  assign score   = score_hi ? 4'd15 : votes_q[3:0];
endmodule
