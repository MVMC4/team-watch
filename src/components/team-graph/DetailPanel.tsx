import { useState } from 'react';
import { TeamData, PanelTab } from './types';

interface DetailPanelProps {
  teamIndex: number | null;
  team: TeamData | null;
  isOpen: boolean;
  onClose: () => void;
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onUpdateTeam: (index: number, patch: Partial<TeamData>) => void;
  onResetTeam: (index: number) => void;
}

/**
 * DETAIL PANEL — Slides in from right on node click.
 * Three tabs: VIEW, EDIT, JSON.
 */
const DetailPanel = ({
  teamIndex, team, isOpen, onClose, activeTab, onTabChange,
  isBookmarked, onToggleBookmark, onUpdateTeam, onResetTeam,
}: DetailPanelProps) => {
  const [copied, setCopied] = useState(false);
  const [changedField, setChangedField] = useState<string | null>(null);

  if (!team || teamIndex === null) {
    return (
      <div style={{
        position: 'fixed', top: 48, right: 0, bottom: 40, width: 340, zIndex: 95,
        background: 'var(--panel-bg)', borderLeft: '1px solid var(--border)',
        transform: 'translateX(340px)', transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
      }} />
    );
  }

  const oor = team.memberCount < 4 || team.memberCount > 10;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(team, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* */ }
  };

  const fieldChange = (field: string, patch: Partial<TeamData>) => {
    onUpdateTeam(teamIndex, patch);
    setChangedField(field);
    setTimeout(() => setChangedField(null), 1000);
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 48,
    right: 0,
    bottom: 40,
    width: 340,
    zIndex: 95,
    background: 'var(--panel-bg)',
    borderLeft: '1px solid var(--border)',
    transform: isOpen ? 'translateX(0)' : 'translateX(340px)',
    transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    color: 'var(--text-primary)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    background: 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid var(--text-primary)' : '2px solid transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    fontWeight: active ? 700 : 400,
    cursor: 'pointer',
    padding: '8px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  });

  const badgeStyle = (color?: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: 10,
    border: `1px solid ${color || 'var(--border)'}`,
    borderRadius: 2,
    marginRight: 4,
    color: color || 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    padding: '6px 8px',
    fontSize: 12,
    fontFamily: "'IBM Plex Mono', monospace",
    borderRadius: 2,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const fieldHighlight = (field: string): React.CSSProperties =>
    changedField === field ? { borderLeft: '2px solid var(--text-primary)', paddingLeft: 8, transition: 'border-left 0.3s' } : {};

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <strong style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {team.teamName}
          </strong>
          <button
            onClick={onToggleBookmark}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 18, cursor: 'pointer', marginRight: 8 }}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this team'}
          >
            {isBookmarked ? '★' : '☆'}
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 16, cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace" }}
          >
            ✕
          </button>
        </div>

        {/* Badges */}
        <div style={{ marginBottom: 10 }}>
          {team.isCompany && <span style={badgeStyle()}>COMPANY</span>}
          {oor && <span style={badgeStyle('var(--accent-invalid)')}>OUT OF RANGE</span>}
          {team.isValid === true && <span style={badgeStyle()}>VALID</span>}
          {team.isValid === false && !oor && <span style={badgeStyle('var(--accent-invalid)')}>INVALID</span>}
          {team.isValid === null && <span style={badgeStyle()}>UNVERIFIED</span>}
          <span style={badgeStyle()}>
            {team.memberCount} MEMBERS ({team.members.length} loaded)
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {(['view', 'edit', 'json'] as PanelTab[]).map(t => (
            <button key={t} style={tabStyle(activeTab === t)} onClick={() => onTabChange(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 16px', flex: 1, overflowY: 'auto' }}>
        {activeTab === 'view' && (
          <>
            {/* Company details */}
            {team.isCompany && team.companyDetails && (
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 8 }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Website:{' '}
                  {team.companyDetails.website ? (
                    <a href={team.companyDetails.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)' }}>
                      {team.companyDetails.website}
                    </a>
                  ) : 'N/A'}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  Facebook:{' '}
                  {team.companyDetails.facebook ? (
                    <a href={team.companyDetails.facebook} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)' }}>
                      {team.companyDetails.facebook}
                    </a>
                  ) : 'N/A'}
                </div>
              </div>
            )}

            {/* Members */}
            <div style={{ color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', fontSize: 10 }}>Members</div>
            {team.members.length > 0 ? (
              team.members.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {m.picture ? (
                    <img
                      src={m.picture} alt={m.name}
                      style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : m.initials ? (
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', background: 'var(--surface-2)',
                      border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 9, fontWeight: 700,
                    }}>
                      {m.initials}
                    </div>
                  ) : (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <a href={m.profileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                      {m.name}
                    </a>
                  </div>
                  {m.githubId && (
                    <a href={`https://github.com/${m.githubId}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', fontSize: 10 }}>
                      GH
                    </a>
                  )}
                </div>
              ))
            ) : team.memberCount > 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                Member details not loaded ({team.memberCount} members)
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No members</div>
            )}
          </>
        )}

        {activeTab === 'edit' && (
          <>
            {/* Team Name */}
            <div style={{ marginBottom: 12, ...fieldHighlight('teamName') }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Team Name</div>
              <input
                type="text"
                value={team.teamName}
                onChange={(e) => {
                  if (e.target.value.length > 0) fieldChange('teamName', { teamName: e.target.value });
                }}
                style={{
                  ...inputStyle,
                  ...(team.teamName.length === 0 ? { borderColor: 'var(--accent-invalid)' } : {}),
                }}
              />
            </div>

            {/* Member Count */}
            <div style={{ marginBottom: 12, ...fieldHighlight('memberCount') }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Member Count</div>
              <input
                type="number" min={0} max={99}
                value={team.memberCount}
                onChange={(e) => fieldChange('memberCount', { memberCount: Math.max(0, Math.min(99, Number(e.target.value))) })}
                style={inputStyle}
              />
              {oor && <div style={{ color: 'var(--accent-invalid)', fontSize: 10, marginTop: 4 }}>⚠ Must be 4–10 for validity</div>}
            </div>

            {/* isValid */}
            <div style={{ marginBottom: 12, ...fieldHighlight('isValid') }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Validity</div>
              {oor ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: 10, fontStyle: 'italic' }}>
                  Auto-set: out of range
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 4 }}>
                  {([
                    { label: 'VALID', val: true },
                    { label: 'INVALID', val: false },
                    { label: 'UNKNOWN', val: null },
                  ] as const).map(({ label, val }) => (
                    <button
                      key={label}
                      onClick={() => fieldChange('isValid', { isValid: val })}
                      style={{
                        background: team.isValid === val ? 'var(--text-primary)' : 'var(--surface-2)',
                        color: team.isValid === val ? 'var(--bg)' : 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                        padding: '3px 8px',
                        fontSize: 10,
                        fontFamily: "'IBM Plex Mono', monospace",
                        cursor: 'pointer',
                        borderRadius: 2,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* isCompany toggle */}
            <div style={{ marginBottom: 12, ...fieldHighlight('isCompany') }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Company</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!team.isCompany}
                  onChange={(e) => fieldChange('isCompany', { isCompany: e.target.checked })}
                  style={{ accentColor: 'var(--text-primary)' }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>{team.isCompany ? 'Yes' : 'No'}</span>
              </label>
            </div>

            {/* Company details sub-form */}
            {team.isCompany && team.companyDetails && (
              <div style={{ marginBottom: 12, paddingLeft: 12, borderLeft: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Website</div>
                <input
                  type="url"
                  value={team.companyDetails.website || ''}
                  onChange={(e) => {
                    const cd = { ...team.companyDetails!, website: e.target.value || null };
                    fieldChange('website', { companyDetails: cd });
                  }}
                  placeholder="https://..."
                  style={{ ...inputStyle, marginBottom: 8 }}
                />
                <div style={{ color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Facebook</div>
                <input
                  type="url"
                  value={team.companyDetails.facebook || ''}
                  onChange={(e) => {
                    const cd = { ...team.companyDetails!, facebook: e.target.value || null };
                    fieldChange('facebook', { companyDetails: cd });
                  }}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>
            )}

            {/* Reset button */}
            <button
              onClick={() => onResetTeam(teamIndex)}
              style={{
                width: '100%',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                padding: '8px 16px',
                fontSize: 10,
                fontFamily: "'IBM Plex Mono', monospace",
                cursor: 'pointer',
                borderRadius: 2,
                marginTop: 16,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Reset to Original
            </button>
          </>
        )}

        {activeTab === 'json' && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={handleCopy}
              style={{
                position: 'absolute', top: 4, right: 4,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', padding: '2px 8px',
                fontSize: 10, cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {copied ? '[ COPIED ✓ ]' : '[ COPY ]'}
            </button>
            <pre style={{
              background: 'var(--surface-2)', padding: 12, borderRadius: 2,
              fontSize: 10, lineHeight: 1.5, overflow: 'auto',
              maxHeight: 'calc(100vh - 280px)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {JSON.stringify(team, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailPanel;
