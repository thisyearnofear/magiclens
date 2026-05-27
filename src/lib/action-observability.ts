type ActionMetadata = Record<string, string | number | boolean | null | undefined>;

type ActionEvent = {
  action: string;
  actionId: string;
  durationMs?: number;
  error?: string;
} & ActionMetadata;

function emitActionEvent(name: string, payload: ActionEvent) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent(`magiclens:${name}`, { detail: payload }));

  const plausible = (window as unknown as {
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
  }).plausible;
  plausible?.(`MagicLens ${name}`, { props: payload });

  if (process.env.NODE_ENV !== 'production') {
    console.info(`[MagicLens] ${name}`, payload);
  }
}

export function createActionId(action: string) {
  const random = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${action}:${Date.now()}:${random}`;
}

export async function measureUserAction<T>(
  action: string,
  run: (actionId: string) => Promise<T>,
  metadata: ActionMetadata = {}
): Promise<T> {
  const actionId = createActionId(action);
  const startedAt = performance.now();
  emitActionEvent('action_start', { action, actionId, ...metadata });

  try {
    const result = await run(actionId);
    emitActionEvent('action_success', {
      action,
      actionId,
      durationMs: Math.round(performance.now() - startedAt),
      ...metadata,
    });
    return result;
  } catch (error) {
    emitActionEvent('action_error', {
      action,
      actionId,
      durationMs: Math.round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : 'Unknown error',
      ...metadata,
    });
    throw error;
  }
}
