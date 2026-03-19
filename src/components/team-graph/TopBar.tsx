import { Stats, DataSource } from './types';

interface TopBarProps {
  stats: Stats | null;
  onExport: () => void;
  onLoadFile: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
  dataSource: DataSource;
  onSwitchToSample: () => void;
}

const TopBar = ({ stats, onExport, onLoadFile, onToggleTheme, isDark, dataSource, onSwitchToSample }: TopBarProps) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 48,
        zIndex: 100,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
          TEAM GRAPH
        </span>

        {/* Data source indicator */}
        <span
          style={{
            fontSize: 9,
            padding: '2px 8px',
            borderRadius: 2,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            background: dataSource === 'current' ? 'var(--accent-invalid)' : 'var(--accent-valid, #4ade80)',
            color: '#000',
          }}
        >
          {dataSource === 'current' ? '● CURRENT' : '● SAMPLE'}
        </span>

        {dataSource === 'current' && (
          <button
            onClick={onSwitchToSample}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              padding: '4px 6px',
              fontSize: 10,
              fontFamily: "'IBM Plex Mono', monospace",
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Reset to sample
          </button>
        )}

        <button
          onClick={onExport}
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            padding: '4px 10px',
            fontSize: 10,
            fontFamily: "'IBM Plex Mono', monospace",
            cursor: 'pointer',
            borderRadius: 2,
          }}
        >
          ↓ Export {dataSource === 'current' ? 'Current' : 'Sample'}
        </button>
        <button
          onClick={onLoadFile}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            padding: '4px 8px',
            fontSize: 10,
            fontFamily: "'IBM Plex Mono', monospace",
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Load custom
        </button>
      </div>

      {stats && (
        <div style={{ display: 'flex', gap: 14, fontSize: 10, color: 'var(--text-secondary)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span>Total: <strong style={{ color: 'var(--text-primary)' }}>{stats.total}</strong></span>
          <span>Valid: <strong style={{ color: 'var(--text-primary)' }}>{stats.valid}</strong></span>
          <span>Invalid: <strong style={{ color: 'var(--accent-invalid)' }}>{stats.invalid}</strong></span>
          <span>Unverified: <strong style={{ color: 'var(--text-primary)' }}>{stats.unvalidated}</strong></span>
          <span>Companies: <strong style={{ color: 'var(--text-primary)' }}>{stats.companies}</strong></span>
        </div>
      )}

      <button
        onClick={onToggleTheme}
        style={{
          background: 'none',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          fontSize: 18,
          cursor: 'pointer',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
        }}
      >
        {isDark ? '☀' : '☽'}
      </button>
    </div>
  );
};

export default TopBar;
