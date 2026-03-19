import { AppTab } from './types';

interface BottomNavProps {
  appTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  bookmarkCount: number;
}

/**
 * BOTTOM NAV BAR — Fixed 40px bar at bottom with EXPLORE / SAVED tabs.
 */
const BottomNav = ({ appTab, onTabChange, bookmarkCount }: BottomNavProps) => {
  const btnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    background: active ? 'var(--surface-2)' : 'transparent',
    border: 'none',
    borderTop: active ? '2px solid var(--text-primary)' : '2px solid transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    fontWeight: active ? 700 : 400,
    cursor: 'pointer',
    height: '100%',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  });

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        zIndex: 100,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <button style={btnStyle(appTab === 'explore')} onClick={() => onTabChange('explore')}>
        🔍 EXPLORE
      </button>
      <button style={btnStyle(appTab === 'saved')} onClick={() => onTabChange('saved')}>
        ★ SAVED ({bookmarkCount})
      </button>
    </div>
  );
};

export default BottomNav;
