import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { TeamData, TeamNode, FilterState, Stats, AppState, AppTab, PanelTab, DataSource } from './types';
import { SAMPLE_JSON } from './sampleData';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import GraphRenderer from './GraphRenderer';
import DetailPanel from './DetailPanel';
import MiniTooltip from './MiniTooltip';
import BottomNav from './BottomNav';
import { LoadingState, NoResultsState } from './EmptyStates';

const applyValidityRules = (team: TeamData): void => {
  if (!team.members) team.members = [];
  if (team.memberCount < 4 || team.memberCount > 10) {
    team.isValid = false;
  }
};

const isOutOfRange = (mc: number) => mc < 4 || mc > 10;

const BOOKMARKS_KEY = 'teamgraph_bookmarks';
const CURRENT_DATA_KEY = 'teamgraph_current';
const DATA_SOURCE_KEY = 'teamgraph_datasource';

const loadBookmarks = (): Set<number> => {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
};

const saveBookmarks = (set: Set<number>) => {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...set]));
  } catch { /* ignore */ }
};

const loadCurrentData = (): TeamData[] | null => {
  try {
    const raw = localStorage.getItem(CURRENT_DATA_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
};

const saveCurrentData = (data: TeamData[]) => {
  try {
    localStorage.setItem(CURRENT_DATA_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
};

const loadDataSource = (): DataSource => {
  try {
    const raw = localStorage.getItem(DATA_SOURCE_KEY);
    if (raw === 'current' || raw === 'sample') return raw;
  } catch { /* ignore */ }
  return 'sample';
};

const saveDataSource = (ds: DataSource) => {
  try {
    localStorage.setItem(DATA_SOURCE_KEY, ds);
  } catch { /* ignore */ }
};

const computeStats = (data: TeamData[]): Stats => ({
  total: data.length,
  valid: data.filter((d) => d.isValid === true).length,
  invalid: data.filter((d) => d.isValid === false).length,
  unvalidated: data.filter((d) => d.isValid === null).length,
  companies: data.filter((d) => d.isCompany === true).length,
});

const initWorkingTree = (): { tree: TeamData[]; source: DataSource } => {
  const savedSource = loadDataSource();
  if (savedSource === 'current') {
    const saved = loadCurrentData();
    if (saved) {
      saved.forEach(applyValidityRules);
      return { tree: saved, source: 'current' };
    }
  }
  const clone: TeamData[] = JSON.parse(JSON.stringify(SAMPLE_JSON));
  clone.forEach(applyValidityRules);
  return { tree: clone, source: 'sample' };
};

const TeamGraph = () => {
  const pristineRef = useRef<TeamData[]>(SAMPLE_JSON);

  const [{ tree: initialTree, source: initialSource }] = useState(initWorkingTree);
  const [workingTree, setWorkingTree] = useState<TeamData[]>(initialTree);
  const [dataSource, setDataSource] = useState<DataSource>(initialSource);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(initialSource === 'current');

  const [appState] = useState<AppState>('ready');
  const [stats, setStats] = useState<Stats>(() => computeStats(initialTree));
  const [isDark, setIsDark] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 768);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    memberCountMin: 4,
    memberCountMax: 10,
    validity: 'all',
    type: 'all',
    hideFiltered: false,
    hideNotFiltered: false,
    hideInvalid: false,
  });
  const [hoveredNode, setHoveredNode] = useState<{ team: TeamData; pos: { x: number; y: number }; matchingMembers?: string[] } | null>(null);
  const [selectedTeamIndex, setSelectedTeamIndex] = useState<number | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>('view');
  const [appTab, setAppTab] = useState<AppTab>('explore');
  const [bookmarks, setBookmarks] = useState<Set<number>>(loadBookmarks);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight - 48 - 40 });

  // Beforeunload warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // Persist current data on changes
  useEffect(() => {
    if (dataSource === 'current') {
      saveCurrentData(workingTree);
    }
  }, [workingTree, dataSource]);

  useEffect(() => {
    (window as any).workingTree = workingTree;
  }, [workingTree]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight - 48 - 40 });
        if (window.innerWidth < 768) setSidebarCollapsed(true);
      }, 200);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedTeamIndex(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const switchToSample = useCallback(() => {
    const clone: TeamData[] = JSON.parse(JSON.stringify(SAMPLE_JSON));
    clone.forEach(applyValidityRules);
    pristineRef.current = SAMPLE_JSON;
    setWorkingTree(clone);
    setDataSource('sample');
    setHasUnsavedChanges(false);
    saveDataSource('sample');
    setSelectedTeamIndex(null);
  }, []);

  const nodes = useMemo((): TeamNode[] => {
    const data = workingTree;
    const maxMC = Math.max(1, ...data.map((d) => d.memberCount || 0));
    const searchLower = filters.search.toLowerCase();

    return data.map((d, i) => {
      const mc = d.memberCount || 0;
      const radius = 10 + ((mc / maxMC) * 30);
      const oor = isOutOfRange(mc);

      // Hide invalid
      if (filters.hideInvalid && d.isValid === false) return null;

      let passesSearch = true;
      let memberMatch = false;
      if (searchLower) {
        const teamNameMatch = d.teamName.toLowerCase().includes(searchLower);
        const memberNames = d.members?.filter(m => m.name.toLowerCase().includes(searchLower)).map(m => m.name) || [];
        memberMatch = memberNames.length > 0;
        passesSearch = teamNameMatch || memberMatch;
      }

      let passes = passesSearch;
      if (!oor && (mc < filters.memberCountMin || mc > filters.memberCountMax)) passes = false;
      if (filters.validity === 'valid' && d.isValid !== true) passes = false;
      if (filters.validity === 'invalid' && d.isValid !== false) passes = false;
      if (filters.validity === 'unknown' && d.isValid !== null) passes = false;
      if (filters.type === 'teams' && d.isCompany === true) passes = false;
      if (filters.type === 'companies' && d.isCompany !== true) passes = false;

      const isSavedMode = appTab === 'saved';
      const isBookmarked = bookmarks.has(i);
      if (isSavedMode && !isBookmarked) return null;

      // hideFiltered = hide nodes that PASS the filter
      // hideNotFiltered = hide nodes that DON'T pass the filter
      if (filters.hideFiltered && passes) return null;
      if (filters.hideNotFiltered && !passes) return null;

      const visible = true;
      const dimmed = !passes && !filters.hideNotFiltered;

      return {
        id: `team-${i}-${d.teamName}`,
        originalIndex: i,
        data: d,
        radius,
        visible,
        dimmed,
        isOutOfRange: oor,
        isBookmarked,
        memberSearchMatch: memberMatch,
        passesFilter: passes,
      };
    }).filter((n): n is TeamNode => n !== null);
  }, [workingTree, filters, appTab, bookmarks]);

  const updateTeam = useCallback((index: number, patch: Partial<TeamData>) => {
    setWorkingTree(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      if (patch.isCompany === true && !next[index].companyDetails) {
        next[index].companyDetails = { facebook: null, website: null };
      }
      if (patch.isCompany === false) {
        next[index].companyDetails = null;
      }
      applyValidityRules(next[index]);
      return next;
    });
    // Switch to current on any edit
    setDataSource('current');
    setHasUnsavedChanges(true);
    saveDataSource('current');
  }, []);

  useEffect(() => {
    setStats(computeStats(workingTree));
  }, [workingTree]);

  const resetTeam = useCallback((index: number) => {
    setWorkingTree(prev => {
      const next = [...prev];
      next[index] = JSON.parse(JSON.stringify(pristineRef.current[index]));
      applyValidityRules(next[index]);
      return next;
    });
  }, []);

  const toggleBookmark = useCallback((index: number) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      saveBookmarks(next);
      return next;
    });
  }, []);

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(workingTree, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = dataSource === 'current' ? 'teams-current.json' : 'teams-sample.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [workingTree, dataSource]);

  const handleFilterChange = useCallback((partial: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      memberCountMin: 4,
      memberCountMax: 10,
      validity: 'all',
      type: 'all',
      hideFiltered: false,
      hideNotFiltered: false,
      hideInvalid: false,
    });
  }, []);

  const handleNodeHover = useCallback((team: TeamData | null, pos: { x: number; y: number }, nodeIndex?: number) => {
    if (!team) { setHoveredNode(null); return; }
    const searchLower = filters.search.toLowerCase();
    let matchingMembers: string[] | undefined;
    if (searchLower && !team.teamName.toLowerCase().includes(searchLower)) {
      matchingMembers = team.members?.filter(m => m.name.toLowerCase().includes(searchLower)).map(m => m.name);
    }
    setHoveredNode({ team, pos, matchingMembers });
  }, [filters.search]);

  const handleNodeClick = useCallback((teamIndex: number) => {
    setSelectedTeamIndex(teamIndex);
    setPanelTab('view');
  }, []);

  const panelOpen = selectedTeamIndex !== null;
  const visibleCount = nodes.filter((n) => !n.dimmed).length;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleLoadFile = useCallback(() => fileInputRef.current?.click(), []);
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data: TeamData[] = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(data)) throw new Error('JSON root must be an array');
        data.forEach(applyValidityRules);
        pristineRef.current = JSON.parse(JSON.stringify(data));
        setWorkingTree(data);
        setDataSource('current');
        setHasUnsavedChanges(true);
        saveDataSource('current');
        saveCurrentData(data);
        setSelectedTeamIndex(null);
      } catch (err) {
        console.error('[TeamGraph] Parse error:', err);
      }
    };
    reader.readAsText(file);
  }, []);

  const graphWidth = useMemo(() => {
    let w = dimensions.width;
    if (!sidebarCollapsed) w -= 240;
    return w;
  }, [dimensions.width, sidebarCollapsed]);

  const graphHeight = dimensions.height;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />

      <TopBar
        stats={stats}
        onExport={handleExport}
        onLoadFile={handleLoadFile}
        onToggleTheme={toggleTheme}
        isDark={isDark}
        dataSource={dataSource}
        onSwitchToSample={switchToSample}
      />

      {appState === 'loading' && <LoadingState />}

      {appState === 'ready' && (
        <>
          <Sidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            visible={visibleCount}
            total={workingTree.length}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
            appTab={appTab}
            bookmarks={bookmarks}
            workingTree={workingTree}
            onSelectTeam={handleNodeClick}
            onUnbookmark={toggleBookmark}
          />

          <div
            style={{
              position: 'fixed',
              top: 48,
              left: sidebarCollapsed ? 0 : 240,
              right: 0,
              bottom: 40,
              transition: 'left 0.25s ease',
            }}
          >
            <GraphRenderer
              nodes={nodes}
              width={graphWidth}
              height={graphHeight}
              onNodeHover={handleNodeHover}
              onNodeClick={handleNodeClick}
            />
          </div>

          {visibleCount === 0 && <NoResultsState onClearFilters={clearFilters} />}

          <MiniTooltip
            team={hoveredNode?.team ?? null}
            position={hoveredNode?.pos ?? { x: 0, y: 0 }}
            matchingMembers={hoveredNode?.matchingMembers}
          />

          <DetailPanel
            teamIndex={selectedTeamIndex}
            team={selectedTeamIndex !== null ? workingTree[selectedTeamIndex] : null}
            isOpen={panelOpen}
            onClose={() => setSelectedTeamIndex(null)}
            activeTab={panelTab}
            onTabChange={setPanelTab}
            isBookmarked={selectedTeamIndex !== null && bookmarks.has(selectedTeamIndex)}
            onToggleBookmark={() => selectedTeamIndex !== null && toggleBookmark(selectedTeamIndex)}
            onUpdateTeam={updateTeam}
            onResetTeam={resetTeam}
          />

          <BottomNav
            appTab={appTab}
            onTabChange={setAppTab}
            bookmarkCount={bookmarks.size}
          />
        </>
      )}
    </div>
  );
};

export default TeamGraph;
