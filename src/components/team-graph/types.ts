export interface TeamMember {
  name: string;
  profileUrl: string;
  initials: string | null;
  githubId: string | null;
  picture: string | null;
}

export interface CompanyDetails {
  facebook: string | null;
  website: string | null;
}

export interface TeamData {
  teamName: string;
  memberCount: number;
  isValid: boolean | null;
  isCompany: boolean | null;
  companyDetails: CompanyDetails | null;
  members: TeamMember[];
}

export interface TeamNode {
  id: string;
  originalIndex: number;
  data: TeamData;
  radius: number;
  visible: boolean;
  dimmed: boolean;
  isOutOfRange: boolean;
  isBookmarked: boolean;
  memberSearchMatch: boolean;
  passesFilter: boolean;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface FilterState {
  search: string;
  memberCountMin: number;
  memberCountMax: number;
  validity: 'all' | 'valid' | 'invalid' | 'unknown';
  type: 'all' | 'teams' | 'companies';
  hideFiltered: boolean;
  hideNotFiltered: boolean;
  hideInvalid: boolean;
}

export type DataSource = 'sample' | 'current';

export interface Stats {
  total: number;
  valid: number;
  invalid: number;
  unvalidated: number;
  companies: number;
}

export type AppState = 'loading' | 'ready';
export type AppTab = 'explore' | 'saved';
export type PanelTab = 'view' | 'edit' | 'json';
