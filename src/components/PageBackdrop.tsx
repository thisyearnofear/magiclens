'use client';

/**
 * Flat app-page backdrop — replaces the stadium photo on interior pages.
 * One calm treatment (dark base + faint accent glow) so content leads;
 * the stadium photo stays on the landing hero only.
 */
export function PageBackdrop({ accent = 'purple' }: { accent?: 'purple' | 'gold' | 'none' }) {
  return (
    <>
      <div className="fixed inset-0 z-0 bg-[#08070d]" />
      {accent !== 'none' && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[1] pointer-events-none"
          style={{
            background:
              accent === 'gold'
                ? 'radial-gradient(80% 50% at 50% 0%, rgba(250,204,21,0.07), transparent 70%)'
                : 'radial-gradient(80% 50% at 50% 0%, rgba(124,58,237,0.10), transparent 70%), radial-gradient(50% 40% at 90% 90%, rgba(59,130,246,0.06), transparent 70%)',
          }}
        />
      )}
    </>
  );
}
