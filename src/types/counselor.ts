export interface Counselor {
  id: string;
  displayName: string;
  title: string;
  bio: string;
  specialties: string[];
  counselorTypes: string[];
  isSupervisor: boolean;
  sessionModes: string[];
  sessionDuration: number;
  pricePerSession: number;
  isAccepting: boolean;
  totalHours: number;
  rating: number;
  location: string;
  avatarUrl: string | null;
  approaches?: string[];
  workingGroups?: string[];
  education?: string[];
  qualifications?: string[];
}

export interface CounselorFilter {
  type?: string;
  approach?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
}
