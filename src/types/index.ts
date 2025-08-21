// Core user and authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'facebook' | 'apple';
  providerId: string;
  partnerId?: string;
  relationshipStartDate?: Date;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}

// Diary entry types
export interface DiaryEntry {
  id: string;
  authorId: string;
  coupleId: string;
  mood: string;
  content: string;
  media: MediaItem[];
  date: Date;
  status: 'waiting' | 'replied';
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail?: string;
  size: number;
  filename: string;
}

// Date planning types
export interface DatePlan {
  id: string;
  coupleId: string;
  title: string;
  scheduledAt: Date;
  location: string;
  notes?: string;
  budget: number;
  checklist: ChecklistItem[];
  createdBy: string;
  status: 'planned' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  assignedTo?: string;
  completedAt?: Date;
}

// Memory types
export interface Memory {
  id: string;
  coupleId: string;
  title: string;
  location: string;
  date: Date;
  photos: MediaItem[];
  tags: string[];
  color: string;
  createdBy: string;
  createdAt: Date;
}

// Theme types
export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  colors: ThemeColors;
}

export interface ThemeColors {
  bg: string;
  bgSoft: string;
  lilac: string;
  sand: string;
  sandDeep: string;
  ice: string;
  goldSoft: string;
  gold: string;
  mint: string;
  line: string;
  ink: string;
  forest: string;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

// PWA types
export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Milestone types
export interface Milestone {
  days: number;
  name: string;
  type: 'special' | 'weekly' | 'monthly' | 'major' | 'anniversary';
  date: Date;
  isPassed: boolean;
  isUpcoming: boolean;
  daysUntil: number;
  daysTogether: number;
}

export interface MilestoneData {
  daysTogether: number;
  milestones: Milestone[];
  nextMilestone?: Milestone;
  recentMilestones: Milestone[];
  upcomingMilestones: Milestone[];
}

// Notification types
export interface NotificationData {
  type: 'diary' | 'date' | 'memory' | 'milestone';
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// Navigation types
export type TabRoute = 'home' | 'calendar' | 'diary' | 'memories' | 'settings';

export interface NavigationItem {
  route: TabRoute;
  label: string;
  icon: string;
}

// Security and encryption types
export interface EncryptedData {
  data: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  salt?: string; // Base64 encoded salt (for password-derived keys)
  tag?: string; // Base64 encoded authentication tag
}

export interface BreakupModeOptions {
  archiveData: boolean;
  deleteSharedData: boolean;
  exportBeforeBreakup: boolean;
  exportPassword?: string;
  reason?: string;
  allowDataRecovery: boolean;
  recoveryPeriodDays: number;
}

export interface BreakupArchive {
  id: string;
  userId: string;
  coupleId: string;
  archivedAt: Date;
  reason?: string;
  recoveryExpiresAt: Date;
  isRecoverable: boolean;
  archiveData: {
    encryptedData: string;
    checksum: string;
    keyHint: string;
  };
}

export interface ExportOptions {
  includeMedia: boolean;
  encryptExport: boolean;
  exportPassword?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includePartnerData: boolean;
}

export interface ExportData {
  metadata: {
    exportedAt: string;
    exportedBy: string;
    coupleId: string;
    version: string;
    isEncrypted: boolean;
  };
  userData: {
    user: Partial<User>;
    partner?: Partial<User>;
  };
  diaryEntries: DiaryEntry[];
  datePlans: DatePlan[];
  memories: Memory[];
  statistics: {
    totalEntries: number;
    totalDates: number;
    totalMemories: number;
    daysTogether: number;
    firstEntry?: string;
    lastEntry?: string;
  };
}