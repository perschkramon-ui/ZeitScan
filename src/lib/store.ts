/**
 * @fileOverview Types for the ZeitScan application. 
 */

export type Employee = {
  id: string;
  adminId: string;
  fullName: string;
  externalEmployeeId: string;
  position?: string;
  agreedHours?: number;
  agreedHoursPeriod?: 'weekly' | 'monthly';
  overtimeBalance?: number;
  vacationDays?: number;
  sickDays?: number;
  isArchived?: boolean;
  /** Obstgärtla special: Pause wird zur Arbeitszeit hinzugezählt, nicht abgezogen */
  pauseAddMode?: boolean;
  /** ISO date string: ab wann der pauseAddMode gilt */
  pauseAddModeActivatedAt?: string | null;
  /** ISO date string: bis wann der pauseAddMode gilt (nur bei Deaktivierung mit Zeitraum) */
  pauseAddModeDeactivatedAt?: string | null;
  /** Obstgärtla special: Überstunden werden auf freie/kurze Tage verteilt */
  overtimeRedistribution?: boolean;
  /** ISO date string: ab wann die Umverteilung aktiv ist */
  overtimeRedistributionDate?: string;
  /** ISO date string: bis wann die Umverteilung aktiv ist (optional) */
  overtimeRedistributionEndDate?: string | null;
  createdAt: string;
};

export type TimeEntry = {
  id: string;
  adminId: string;
  employeeId: string;
  employeeName?: string;
  clockInTime: string;
  clockOutTime?: string | null;
  exitType?: 'PAUSE' | 'END' | null;
  entryType?: 'WORK' | 'VACATION' | 'SICK' | null;
  sourceSystem: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = {
  id: string;
  email: string;
  fullName?: string;
  isPremium: boolean;
  trialStartedAt?: string | null;
  /** Per-user trial duration override (default 30) */
  trialDays?: number;
  stripeCustomerId?: string;
  createdAt: string;
  /** If true, missing break times are automatically added per §4 ArbZG */
  autoBreakDeduction?: boolean;
  /** If true, employees can only clock in/out from the office network */
  locationLockEnabled?: boolean;
  /** The public IP of the office network (saved by admin) */
  locationIp?: string;
  /** Last IP reported by a client (employee portal/MA app) visiting from the customer's network */
  lastClientIp?: string;
  /** ISO timestamp of when lastClientIp was reported */
  lastClientIpAt?: string;

  // ── ArbZG Compliance Settings ──
  /** §3 ArbZG: Max 10h/day enforcement. 'off' | 'warn' | 'block' (default: 'off') */
  maxDailyHoursMode?: 'off' | 'warn' | 'block';
  /** §5 ArbZG: Min 11h rest between days. 'off' | 'warn' | 'block' (default: 'off') */
  restPeriodMode?: 'off' | 'warn' | 'block';
  /** §9 ArbZG: Flag Sunday/holiday work (default: false) */
  sundayWorkDetection?: boolean;
  /** Automatic overtime calculation from agreedHours vs actual (default: true) */
  autoOvertimeCalc?: boolean;
  /** Array of dismissed warning IDs */
  dismissedWarnings?: string[];
};

export type ScheduleEntry = {
  id: string;
  adminId: string;
  employeeId: string;
  employeeName: string;
  date: string; // ISO date string: 'yyyy-MM-dd'
  shiftStart: string; // e.g. '08:00'
  shiftEnd: string;   // e.g. '17:00'
  breakStart?: string; // e.g. '12:00'
  breakEnd?: string;   // e.g. '12:30'
  note?: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  adminId: string;
  senderName: string;
  senderRole: 'empfang' | 'buero';
  text: string;
  createdAt: string;
  readBy: string[]; // array of role identifiers that have read this message
};
