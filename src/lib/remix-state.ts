import type { OverlayStyle } from '@/components/remix/EditorOverlay';
import type { AnchorId } from '@/lib/overlay-anchors';

/**
 * The replayable "recipe" for a minted remix — everything needed to rebuild
 * the AR output on the public /remix/[txHash] page without the author present.
 *
 * Stored inside the token metadata `attributes` array as a single JSON-string
 * trait ("remix_state") — the backend schema is fixed-shape but attributes is
 * free-form JSONB, so this ships with zero backend changes.
 *
 * Trajectories are NOT stored: for `mode: 'track'` the public page re-runs
 * useClipPoseTracker on the clip (~seconds), which is deterministic enough to
 * recover the same subject ids and yields the full tracked replay.
 */

export interface RemixStateOverlay {
  id: string;
  /** chosen pack variant, e.g. a country flag or accent color */
  variant?: { name: string; accent?: string; flagUrl?: string };
  /** editor-authored placement (static mode) */
  style?: OverlayStyle;
  /** attach-point override (track mode) */
  anchor?: AnchorId;
}

export interface RemixState {
  v: 1;
  clipUrl: string;
  clipTitle: string;
  /** 'track' = pose-tracked replay; 'static' = editor placements replay */
  mode: 'track' | 'static';
  /** subject the author tracked (deterministic across re-analysis) */
  subjectId?: number;
  /** editor canvas size the styles were authored on (static mode scaling) */
  sourceSize?: { w: number; h: number };
  overlays: RemixStateOverlay[];
}

export function encodeRemixState(state: RemixState): { trait_type: string; value: string } {
  return { trait_type: 'remix_state', value: JSON.stringify(state) };
}

/** Pull a RemixState out of a metadata attributes array, tolerating bad data. */
export function decodeRemixState(
  attributes: Array<{ trait_type?: string; value?: unknown }> | null | undefined,
): RemixState | null {
  if (!Array.isArray(attributes)) return null;
  const trait = attributes.find((a) => a?.trait_type === 'remix_state');
  if (!trait || typeof trait.value !== 'string') return null;
  try {
    const parsed = JSON.parse(trait.value) as RemixState;
    if (parsed?.v !== 1 || !parsed.clipUrl || !Array.isArray(parsed.overlays)) return null;
    return parsed;
  } catch {
    return null;
  }
}
