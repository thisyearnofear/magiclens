import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm';
const MODEL_PATH = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

let filesetPromise: ReturnType<typeof FilesetResolver.forVisionTasks> | null = null;

/**
 * Creates a PoseLandmarker instance. The WASM fileset is shared (loaded once);
 * each caller gets its own landmarker because VIDEO mode requires monotonically
 * increasing timestamps — separate sources (webcam vs clip) need separate
 * instances or their timelines collide.
 */
export async function loadPoseLandmarker(opts?: { numPoses?: number }): Promise<PoseLandmarker> {
  if (!filesetPromise) {
    filesetPromise = FilesetResolver.forVisionTasks(WASM_BASE);
  }
  const wasmFileset = await filesetPromise;
  return PoseLandmarker.createFromOptions(wasmFileset, {
    baseOptions: {
      modelAssetPath: MODEL_PATH,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numPoses: opts?.numPoses ?? 1,
    minPoseDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}
