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
  stripeCustomerId?: string;
  createdAt: string;
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
