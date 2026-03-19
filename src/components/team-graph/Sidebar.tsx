import { FilterState, TeamData, AppTab } from './types';

interface SidebarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  visible: number;
  total: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  appTab: AppTab;
  bookmarks: Set<number>;
  workingTree: TeamData[];
  onSelectTeam: (index: number) => void;
  onUnbookmark: (index: number) => void;
}

const s = {
  label: {
    color: 'var(--text-secondary)',
    marginBottom: 4,
    marginTop: 12,
    textTransform: 'uppercase' as const,
    fontSize: 10,
    letterSpacing: '0.1em',
  },
  input: {
    width: '100%',
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    padding: '6px 8px',
    fontSize: 12,
    fontFamily: "'IBM Plex Mono', monospace",
    borderRadius: 2,
    outline: 'none',
  } as React.CSSProperties,
};

const Sidebar = ({
  filters, onFilterChange, visible, total, collapsed, onToggleCollapse,
  appTab, bookmarks, workingTree, onSelectTeam, onUnbookmark,
}: SidebarProps) => {
  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    top: 48,
    left: 0,
    bottom: 40,
    width: 240,
    zIndex: 90,
    overflowY: 'auto',
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    padding: 16,
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    transform: collapsed ? 'translateX(-240px)' : 'translateX(0)',
    transition: 'transform 0.25s ease',
  };

  const toggleBtnStyle: React.CSSProperties = {
    position: 'fixed',
    top: 56,
    left: collapsed ? 8 : 248,
    zIndex: 91,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    borderRadius: 2,
    transition: 'left 0.25s ease',
    fontFamily: "'IBM Plex Mono', monospace",
  };

  const toggleBtn = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      style={{
        background: active ? 'var(--text-primary)' : 'var(--surface-2)',
        color: active ? 'var(--bg)' : 'var(--text-secondary)',
        border: '1px solid var(--border)',
        padding: '3px 8px',
        fontSize: 10,
        fontFamily: "'IBM Plex Mono', monospace",
        cursor: 'pointer',
        borderRadius: 2,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </button>
  );

  const bookmarkedIndices = [...bookmarks];

  return (
    <>
      <button style={toggleBtnStyle} onClick={onToggleCollapse}>
        {collapsed ? '▶' : '◀'}
      </button>
      <div style={sidebarStyle}>
        {appTab === 'explore' ? (
          <>
            <div style={{ color: 'var(--text-primary)', marginBottom: 12, fontWeight: 700 }}>
              Showing {visible} of {total} teams
            </div>

            {/* Search */}
            <div style={s.label}>Search (teams + members)</div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Team or member name..."
                value={filters.search}
                onChange={(e) => onFilterChange({ search: e.target.value })}
                style={s.input}
              />
              {filters.search && (
                <button
                  onClick={() => onFilterChange({ search: '' })}
                  style={{
                    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 14, fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  ×
                </button>
              )}
            </div>
            {filters.search && (
              <div style={{ color: 'var(--text-secondary)', fontSize: 10, marginTop: 4 }}>
                {visible} teams match
              </div>
            )}

            {/* Member count range */}
            <div style={s.label}>Member Count (4–10)</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{filters.memberCountMin}</span>
              <input
                type="range" min={4} max={10}
                value={filters.memberCountMin}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onFilterChange({ memberCountMin: Math.min(val, filters.memberCountMax) });
                }}
                style={{ flex: 1, accentColor: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{filters.memberCountMax}</span>
              <input
                type="range" min={4} max={10}
                value={filters.memberCountMax}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onFilterChange({ memberCountMax: Math.max(val, filters.memberCountMin) });
                }}
                style={{ flex: 1, accentColor: 'var(--text-primary)' }}
              />
            </div>

            {/* Validity */}
            <div style={s.label}>Validity</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(['all', 'valid', 'invalid', 'unknown'] as const).map((v) =>
                toggleBtn(v, filters.validity === v, () => onFilterChange({ validity: v }))
              )}
            </div>

            {/* Type */}
            <div style={s.label}>Type</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(['all', 'teams', 'companies'] as const).map((v) =>
                toggleBtn(v, filters.type === v, () => onFilterChange({ type: v }))
              )}
            </div>

            {/* Hide invalid */}
            <div style={{ ...s.label, marginTop: 16 }}>Hide Invalid</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox" checked={filters.hideInvalid}
                onChange={(e) => onFilterChange({ hideInvalid: e.target.checked })}
                style={{ accentColor: 'var(--accent-invalid)' }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>Hide invalid teams</span>
            </label>

            {/* Hide filtered */}
            <div style={{ ...s.label, marginTop: 12 }}>Visibility</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 6 }}>
              <input
                type="checkbox" checked={filters.hideFiltered}
                onChange={(e) => onFilterChange({ hideFiltered: e.target.checked })}
                style={{ accentColor: 'var(--text-primary)' }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>Hide filtered</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox" checked={filters.hideNotFiltered}
                onChange={(e) => onFilterChange({ hideNotFiltered: e.target.checked })}
                style={{ accentColor: 'var(--accent-match)' }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>Hide not filtered</span>
            </label>
          </>
        ) : (
          /* SAVED TAB */
          <>
            <div style={{ color: 'var(--text-primary)', marginBottom: 12, fontWeight: 700 }}>
              Saved Teams ({bookmarkedIndices.length})
            </div>
            {bookmarkedIndices.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: 11, textAlign: 'center', marginTop: 40, lineHeight: 1.6 }}>
                No saved teams yet.<br />Click ☆ on any team to save it.
              </div>
            ) : (
              bookmarkedIndices.map((idx) => {
                const team = workingTree[idx];
                if (!team) return null;
                const oor = team.memberCount < 4 || team.memberCount > 10;
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 10px',
                      border: '1px solid var(--border)',
                      borderRadius: 2,
                      marginBottom: 6,
                      cursor: 'pointer',
                      background: 'var(--surface-2)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        onClick={() => onSelectTeam(idx)}
                        style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-primary)', flex: 1 }}
                      >
                        ★ {team.teamName.length > 16 ? team.teamName.substring(0, 16) + '…' : team.teamName}
                      </span>
                      <button
                        onClick={() => onUnbookmark(idx)}
                        style={{
                          background: 'none', border: 'none', color: 'var(--text-secondary)',
                          cursor: 'pointer', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {team.memberCount} members ·{' '}
                      {oor ? (
                        <span style={{ color: 'var(--accent-invalid)' }}>OUT OF RANGE</span>
                      ) : team.isValid === true ? 'VALID' : team.isValid === false ? 'INVALID' : 'UNVERIFIED'}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Sidebar;
