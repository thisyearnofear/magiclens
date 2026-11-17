import { createPublicClient, decodeFunctionResult, encodeFunctionData, http } from 'viem';
import { xLayer } from 'wagmi/chains';

/**
 * Client-side TapeOut verification: re-runs `processor.eval(circuitId, inputs)`
 * as a free read-only eth_call on X Layer mainnet so anyone can check a
 * recorded ICONIC-GATE verdict themselves — no wallet, no backend.
 */

const EVAL_ABI = [
  {
    name: 'eval',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'circuitId', type: 'uint256' },
      { name: 'inputs', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bytes' }],
  },
] as const;

const publicClient = createPublicClient({
  chain: xLayer,
  transport: http('https://rpc.xlayer.tech'),
});

export interface TapeoutEvalResult {
  outputHex: string;
  blockNumber: bigint;
}

export async function evalTapeoutCircuit(
  processor: string,
  circuitId: number,
  inputsHex: string
): Promise<TapeoutEvalResult> {
  const data = encodeFunctionData({
    abi: EVAL_ABI,
    functionName: 'eval',
    args: [BigInt(circuitId), inputsHex as `0x${string}`],
  });
  const [res, blockNumber] = await Promise.all([
    publicClient.call({
      to: processor as `0x${string}`,
      data,
    }),
    publicClient.getBlockNumber(),
  ]);
  const output = decodeFunctionResult({
    abi: EVAL_ABI,
    functionName: 'eval',
    data: res.data,
  });
  return { outputHex: output as string, blockNumber };
}
