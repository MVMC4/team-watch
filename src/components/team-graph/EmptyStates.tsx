/**
 * LOADING STATE — Animated pulsing ring indicator.
 */
export const LoadingState = () => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      zIndex: 50,
      fontFamily: "'IBM Plex Mono', monospace",
    }}
  >
    <div
      style={{
        width: 64,
        height: 64,
        border: '2px solid var(--loading-ring)',
        borderRadius: '50%',
        animation: 'pulse-ring 1.5s ease-in-out infinite',
        marginBottom: 20,
      }}
    />
    <div style={{ color: 'var(--text-secondary)', fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
      PARSING DATA…
    </div>
  </div>
);

/**
 * NO RESULTS STATE — Overlay on graph when filters yield 0 results.
 */
export const NoResultsState = ({ onClearFilters }: { onClearFilters: () => void }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
      zIndex: 80,
      fontFamily: "'IBM Plex Mono', monospace",
    }}
  >
    <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>
      NO TEAMS MATCH FILTERS
    </div>
    <button
      onClick={onClearFilters}
      style={{
        background: 'var(--text-primary)',
        color: 'var(--bg)',
        border: 'none',
        padding: '6px 20px',
        fontSize: 11,
        fontFamily: "'IBM Plex Mono', monospace",
        cursor: 'pointer',
        borderRadius: 2,
      }}
    >
      CLEAR FILTERS
    </button>
  </div>
);
