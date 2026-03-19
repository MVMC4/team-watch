import { TeamData } from './types';

interface MiniTooltipProps {
  team: TeamData | null;
  position: { x: number; y: number };
  matchingMembers?: string[];
}

/**
 * MINI TOOLTIP — lightweight floating pill near cursor on hover.
 * Shows team info + member list. pointer-events: none.
 */
const MiniTooltip = ({ team, position, matchingMembers }: MiniTooltipProps) => {
  if (!team) return null;

  const oor = team.memberCount < 4 || team.memberCount > 10;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x + 12,
        top: position.y + 8,
        zIndex: 300,
        pointerEvents: 'none',
        background: 'var(--panel-bg)',
        border: '1px solid var(--panel-border)',
        borderRadius: 4,
        padding: '8px 10px',
        maxWidth: 220,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-primary)', marginBottom: 2 }}>
        {team.isCompany ? '◆ ' : ''}{team.teamName.length > 20 ? team.teamName.substring(0, 20) + '…' : team.teamName}
      </div>
      <div style={{ color: 'var(--text-secondary)', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span>{team.memberCount} members</span>
        {oor ? (
          <span style={{ color: 'var(--accent-invalid)', fontWeight: 700, fontSize: 9 }}>OUT OF RANGE</span>
        ) : team.isValid === true ? (
          <span style={{ fontSize: 9 }}>VALID</span>
        ) : team.isValid === false ? (
          <span style={{ color: 'var(--accent-invalid)', fontSize: 9 }}>INVALID</span>
        ) : (
          <span style={{ fontSize: 9 }}>UNVERIFIED</span>
        )}
        {team.isCompany && (
          <span style={{ fontSize: 9, fontWeight: 700 }}>COMPANY</span>
        )}
      </div>

      {/* Members list */}
      {team.members && team.members.length > 0 && (
        <div style={{ marginTop: 5, borderTop: '1px solid var(--border)', paddingTop: 4 }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 9, textTransform: 'uppercase', marginBottom: 3 }}>Members</div>
          {team.members.slice(0, 6).map((m, i) => (
            <div key={i} style={{ color: 'var(--text-primary)', fontSize: 10, marginBottom: 1 }}>
              {m.name.length > 24 ? m.name.substring(0, 24) + '…' : m.name}
            </div>
          ))}
          {team.members.length > 6 && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 9, fontStyle: 'italic' }}>
              +{team.members.length - 6} more
            </div>
          )}
        </div>
      )}

      {matchingMembers && matchingMembers.length > 0 && (
        <div style={{ color: 'var(--text-secondary)', marginTop: 3, fontSize: 9, fontStyle: 'italic' }}>
          Match: {matchingMembers.slice(0, 3).join(', ')}
        </div>
      )}
    </div>
  );
};

export default MiniTooltip;
