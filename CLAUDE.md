# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read the global rules first (applies to EVERY session, especially cloud/phone)

The cross-project rules (token policy, project-memory duty, **error classes with
guards**) are NOT in this file — they live in the master repo
`https://github.com/perschkramon-ui/claude-global`, the single source of truth.
They are written in German, like the operator's other rules.

- **Local sessions** (PC/laptop) get them automatically via a SessionStart hook
  that syncs them to `~/.claude/CLAUDE.md`. Nothing to do.
- **Cloud sessions** (including from the phone via claude.ai/code) have no access
  to the PC filesystem and get them ONLY this way — clone it during onboarding
  in addition to this repo and read it as the global rules:
  ```bash
  gh repo clone perschkramon-ui/claude-global
  ```
  Without this step the session works without the error-class guards.

## Commands

```bash
npm run dev          # Dev server on port 9002 (Turbopack)
npm run build        # Production build
npm run typecheck    # tsc --noEmit
npm run lint         # Next.js ESLint
npm run genkit:dev   # Genkit AI dev UI (separate process)
```

## Architecture

**ZeitScan** is a multi-tenant QR-code time-tracking SaaS (Arbeitszeiterfassung) built with Next.js 15 App Router, Firebase Firestore, and Firebase Auth. Deployed on Firebase App Hosting.

### Multi-Tenancy Model
All data is scoped by `adminId` (the Firebase UID of the admin who owns the account). Every Firestore document in `employees`, `timeEntries`, `schedules`, and `chatMessages` carries an `adminId` field. Queries always filter by `adminId`.

### Authentication Roles
| Role | Auth Method | Access |
|------|------------|--------|
| Admin | Email/password | Full access to own tenant |
| Terminal/Portal | Anonymous (`signInAnonymously`) | Clock-in/out only; location-locked |
| SuperAdmin | `perschkramon@gmail.com` | All tenants |

The `/portal` and `/ma/[id]` pages auto-login anonymously on load. `/scan` requires email/password.

### Route Map
- `/` — Landing page
- `/scan` — Admin login gate → generates QR code linking to `/portal?adminId=<uid>`
- `/portal?adminId=` — Employee clock-in/out terminal (runs as anonymous user)
- `/ma/[id]` — Employee personal app: own hours, manual entries, vacation, schedule (anonymous)
- `/admin/dashboard` — Full admin panel: all time logs, employee management, ArbZG compliance, AI insights, billing

### Firestore Collections
```
employees/{id}       adminId, fullName, externalEmployeeId, agreedHours, overtimeBalance, ...
timeEntries/{id}     adminId, employeeId, clockInTime, clockOutTime, exitType (PAUSE|END), entryType (WORK|VACATION|SICK)
adminUsers/{uid}     isPremium, trialStartedAt, locationLockEnabled, locationIp, autoBreakDeduction, ArbZG settings
schedules/{id}       adminId, employeeId, date (yyyy-MM-dd), shiftStart, shiftEnd
chatMessages/{id}    adminId, senderRole (empfang|buero), text, readBy[]
```

### Firebase Write Pattern
All Firestore writes use non-blocking helpers from `@/firebase` to avoid blocking the UI:
```ts
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
```
These fire-and-forget internally, routing errors to the global `errorEmitter` which shows permission errors via `FirebaseErrorListener`. Never use raw `setDoc`/`updateDoc` directly in page components.

### Firebase Hooks — Critical Constraint
`useCollection` and `useDoc` (from `@/firebase`) require their query/ref argument to be wrapped with `useMemoFirebase`. The hook enforces this at runtime and throws if the ref is not memoized:
```ts
const q = useMemoFirebase(
  () => query(collection(firestore, 'timeEntries'), where('adminId', '==', adminId)),
  [firestore, adminId]
);
const { data } = useCollection<TimeEntry>(q);
```

### Firebase Initialization
`initializeFirebase()` in `src/firebase/index.ts` — **do not modify**. It tries `initializeApp()` without args first (Firebase App Hosting production), then falls back to `firebaseConfig` from `src/firebase/config.ts` for local dev. The warning "Automatic initialization failed" during builds is expected and harmless.

### AI Flows (Genkit)
Two server-side flows in `src/ai/flows/`, both marked `'use server'`. Called directly from the admin dashboard as async server actions:
- `identifyUnusualClockActivity` — detects anomalies (very early/late, short shifts, missing clock-outs)
- `admin-summarize-employee-work-patterns` — work pattern summaries

Model: Google Gemini 2.5 Flash via `@genkit-ai/google-genai`. Requires `GOOGLE_GENAI_API_KEY` env var.

### Key Business Logic
- **`pauseAddMode`** (per Employee): break time is added to work time instead of subtracted — a special customer configuration
- **`overtimeRedistribution`**: overtime hours are spread across days where the employee worked less than their `agreedHours`
- **ArbZG compliance** (German labor law, configured per admin):
  - `maxDailyHoursMode` — §3: max 10h/day (off | warn | block)
  - `restPeriodMode` — §5: min 11h rest between shifts (off | warn | block)
  - `sundayWorkDetection` — §9: flags Sunday/holiday entries
- **Location Lock**: terminal reports client IP → `adminUsers.lastClientIp`; portal reads `adminUsers.locationIp` and blocks clock-ins if they don't match

### Billing (Stripe)
- `POST /api/checkout` — creates Stripe Checkout session with 30-day trial
- `POST /api/customer-portal` — opens Stripe billing portal
- Webhook not implemented; `isPremium` on `adminUsers` is set manually or via a Stripe webhook
- Env vars: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`

### Environment Variables
```
GOOGLE_GENAI_API_KEY    Gemini AI (Genkit flows)
STRIPE_SECRET_KEY       Stripe payments
STRIPE_PRICE_ID         Stripe subscription price ID
```
Firebase config is hardcoded in `src/firebase/config.ts` for client-side; server-side admin SDK uses Firebase App Hosting automatic credential injection.
