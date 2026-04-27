"use client";

import { useState, useEffect, useMemo, Suspense, use } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  useFirestore, 
  useCollection, 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useAuth
} from '@/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import type { Employee, TimeEntry, ScheduleEntry, AdminUser } from '@/lib/store';
import { format, startOfMonth, parseISO, isSameDay, addDays, differenceInMinutes, startOfDay, endOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  CheckCircle2, 
  LogIn, 
  LogOut, 
  Loader2, 
  Coffee, 
  Moon, 
  CalendarCheck2, 
  Palmtree, 
  Stethoscope,
  Clock,
  CalendarPlus,
  Plus,
  Pencil,
  Trash2,
  History,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Wifi
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

function MAAppContent({ id }: { id: string }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'present' | 'pause' | 'absent'>('absent');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [locationBlocked, setLocationBlocked] = useState(false);

  const [timeEntriesMonth, setTimeEntriesMonth] = useState<TimeEntry[]>([]);
  const [allTimeEntries, setAllTimeEntries] = useState<TimeEntry[]>([]);
  const [takenVacationDays, setTakenVacationDays] = useState(0);
  const [upcomingSchedules, setUpcomingSchedules] = useState<ScheduleEntry[]>([]);

  // ── Manual Entry Dialog State ──
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manualDate, setManualDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [manualStartTime, setManualStartTime] = useState('08:00');
  const [manualEndTime, setManualEndTime] = useState('17:00');
  const [manualBreakMins, setManualBreakMins] = useState('30');
  const [isManualSaving, setIsManualSaving] = useState(false);

  // ── Edit Existing Entry State ──
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  // ── History Expansion ──
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Admin settings for location lock
  const [adminSettings, setAdminSettings] = useState<AdminUser | null>(null);

  // 1. Auto-login anonymously
  useEffect(() => {
    if (auth && !auth.currentUser) {
      signInAnonymously(auth).catch((err) => {
        console.error("Anonymous sign-in failed:", err);
      });
    }
  }, [auth]);

  // 2. Fetch Employee Data
  useEffect(() => {
    if (!firestore || !id) return;
    const fetchEmployee = async () => {
      try {
        const docRef = doc(firestore, 'employees', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEmployee({ id: docSnap.id, ...docSnap.data() } as Employee);
        } else {
          setEmployee(null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchEmployee();
  }, [firestore, id]);

  // 2b. Fetch Admin Settings (for location lock)
  useEffect(() => {
    if (!firestore || !employee) return;
    const fetchAdmin = async () => {
      try {
        const adminRef = doc(firestore, 'adminUsers', employee.adminId);
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          setAdminSettings({ id: adminSnap.id, ...adminSnap.data() } as AdminUser);
        }
      } catch (e) {
        console.error('Failed to load admin settings:', e);
      }
    };
    fetchAdmin();
  }, [firestore, employee]);

  // 3. Listen to Time Entries (Status & Dashboard)
  useEffect(() => {
    if (!firestore || !employee || !auth?.currentUser) return;
    
    // Listen to all entries for status (we limit to start of month to get both status and monthly stats)
    const startOfCurrentMonth = startOfMonth(new Date()).toISOString();
    
    const q = query(
      collection(firestore, 'timeEntries'), 
      where('employeeId', '==', employee.id),
      where('adminId', '==', employee.adminId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as TimeEntry));
      
      // Store all entries for history
      setAllTimeEntries(entries);

      // Filter for this month dashboard stats
      const monthEntries = entries.filter(e => e.clockInTime >= startOfCurrentMonth);
      setTimeEntriesMonth(monthEntries);

      // Compute taken vacation (count of entries with entryType = VACATION)
      // Usually entered per day or as multiple entries
      const vacationEntries = entries.filter(e => e.entryType === 'VACATION');
      setTakenVacationDays(vacationEntries.length);

      // Status Check
      const sorted = entries.sort((a, b) => b.clockInTime.localeCompare(a.clockInTime));
      const lastEntry = sorted[0];

      if (lastEntry && !lastEntry.clockOutTime) {
        setActiveEntryId(lastEntry.id);
        setCurrentStatus('present');
      } else if (lastEntry && lastEntry.exitType === 'PAUSE') {
        setActiveEntryId(null);
        setCurrentStatus('pause');
      } else {
        setActiveEntryId(null);
        setCurrentStatus('absent');
      }
    });

    return () => unsubscribe();
  }, [firestore, employee, auth]);

  // 4. Listen to Schedules
  useEffect(() => {
    if (!firestore || !employee || !auth?.currentUser) return;
    
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const q = query(
      collection(firestore, 'schedules'),
      where('employeeId', '==', employee.id),
      where('adminId', '==', employee.adminId)
      // Firestore requires index if we use multiple where/orderby, so we filter dates in memory
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allSchedules = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ScheduleEntry));
      const upcoming = allSchedules
        .filter(s => s.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date));
      setUpcomingSchedules(upcoming);
    });

    return () => unsubscribe();
  }, [firestore, employee, auth]);

  // ── Recent Work History (sorted by clockInTime desc) ──
  const recentWorkEntries = useMemo(() => {
    return allTimeEntries
      .filter(e => !e.entryType || e.entryType === 'WORK')
      .sort((a, b) => b.clockInTime.localeCompare(a.clockInTime));
  }, [allTimeEntries]);

  const handleClockAction = async (action: 'IN' | 'OUT', exitType?: 'PAUSE' | 'END') => {
    if (!employee || !firestore) return;
    setIsProcessing(true);

    // Location lock enforcement
    if (adminSettings?.locationLockEnabled && adminSettings?.locationIp) {
      try {
        const res = await fetch('/api/get-ip');
        const data = await res.json();
        if (data.ip !== adminSettings.locationIp) {
          toast({
            title: "Standort nicht erkannt",
            description: "Stempeln ist nur aus dem Firmen-WLAN möglich. Bitte verbinde dich mit dem WLAN deines Betriebes.",
            variant: "destructive"
          });
          setIsProcessing(false);
          setLocationBlocked(true);
          return;
        }
        setLocationBlocked(false);
      } catch {
        toast({
          title: "Fehler",
          description: "Standort-Prüfung fehlgeschlagen. Bitte versuche es erneut.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
    }

    if (action === 'IN') {
      const entryData = {
        adminId: employee.adminId,
        employeeId: employee.id,
        employeeName: employee.fullName,
        clockInTime: new Date().toISOString(),
        clockOutTime: null,
        sourceSystem: 'MA App',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      addDocumentNonBlocking(collection(firestore, 'timeEntries'), entryData)
        .then(() => {
          showSuccess('eingestempelt');
        })
        .catch(() => {
          toast({ title: "Fehler", description: "Einstempeln fehlgeschlagen.", variant: "destructive" });
          setIsProcessing(false);
        });
    } else {
      if (!activeEntryId) {
        setIsProcessing(false);
        return;
      }

      const updateData = {
        clockOutTime: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        exitType: exitType || 'END'
      };

      updateDocumentNonBlocking(doc(firestore, 'timeEntries', activeEntryId), updateData);
      showSuccess(exitType === 'PAUSE' ? 'in die Pause gegangen' : 'ausgestempelt');
      setIsExitDialogOpen(false);
    }
  };

  // ── Manual Entry Handler ──
  const handleAddManualEntry = () => {
    if (!employee || !firestore || !manualDate || !manualStartTime || !manualEndTime) {
      toast({ title: "Fehler", description: "Bitte alle Felder ausfüllen.", variant: "destructive" });
      return;
    }

    const clockIn = new Date(`${manualDate}T${manualStartTime}:00`);
    const clockOut = new Date(`${manualDate}T${manualEndTime}:00`);

    if (clockOut <= clockIn) {
      toast({ title: "Fehler", description: "Ende muss nach dem Start liegen.", variant: "destructive" });
      return;
    }

    // Check for future dates
    if (clockIn > new Date()) {
      toast({ title: "Fehler", description: "Zukünftige Einträge sind nicht erlaubt.", variant: "destructive" });
      return;
    }

    setIsManualSaving(true);

    const breakMins = parseInt(manualBreakMins) || 0;

    // If break time specified, create two entries (before break and after break)
    // Otherwise create a single entry
    if (breakMins > 0) {
      const totalMins = differenceInMinutes(clockOut, clockIn);
      const workBeforeBreak = Math.floor((totalMins - breakMins) / 2);
      const breakStart = new Date(clockIn.getTime() + workBeforeBreak * 60000);
      const breakEnd = new Date(breakStart.getTime() + breakMins * 60000);

      // First segment: clockIn → breakStart
      addDocumentNonBlocking(collection(firestore, 'timeEntries'), {
        adminId: employee.adminId,
        employeeId: employee.id,
        employeeName: employee.fullName,
        clockInTime: clockIn.toISOString(),
        clockOutTime: breakStart.toISOString(),
        entryType: 'WORK',
        exitType: 'PAUSE',
        sourceSystem: 'MA App (Nachtrag)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Second segment: breakEnd → clockOut
      addDocumentNonBlocking(collection(firestore, 'timeEntries'), {
        adminId: employee.adminId,
        employeeId: employee.id,
        employeeName: employee.fullName,
        clockInTime: breakEnd.toISOString(),
        clockOutTime: clockOut.toISOString(),
        entryType: 'WORK',
        exitType: 'END',
        sourceSystem: 'MA App (Nachtrag)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      addDocumentNonBlocking(collection(firestore, 'timeEntries'), {
        adminId: employee.adminId,
        employeeId: employee.id,
        employeeName: employee.fullName,
        clockInTime: clockIn.toISOString(),
        clockOutTime: clockOut.toISOString(),
        entryType: 'WORK',
        exitType: 'END',
        sourceSystem: 'MA App (Nachtrag)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const netMins = differenceInMinutes(clockOut, clockIn) - breakMins;
    const hours = Math.floor(netMins / 60);
    const mins = netMins % 60;

    toast({
      title: "Arbeitszeit eingetragen",
      description: `${format(clockIn, 'dd.MM.yyyy', { locale: de })} — ${manualStartTime} bis ${manualEndTime} (${hours}h ${mins}min netto)`,
    });

    setIsManualSaving(false);
    setIsManualEntryOpen(false);
    // Reset to today
    setManualDate(format(new Date(), 'yyyy-MM-dd'));
    setManualStartTime('08:00');
    setManualEndTime('17:00');
    setManualBreakMins('30');
  };

  // ── Edit Entry Handler ──
  const handleEditEntry = () => {
    if (!editingEntry || !firestore || !editStartTime || !editEndTime) return;

    const clockIn = new Date(`${editDate}T${editStartTime}:00`);
    const clockOut = new Date(`${editDate}T${editEndTime}:00`);

    if (clockOut <= clockIn) {
      toast({ title: "Fehler", description: "Ende muss nach dem Start liegen.", variant: "destructive" });
      return;
    }

    updateDocumentNonBlocking(doc(firestore, 'timeEntries', editingEntry.id), {
      clockInTime: clockIn.toISOString(),
      clockOutTime: clockOut.toISOString(),
      updatedAt: new Date().toISOString(),
    });

    toast({ title: "Aktualisiert", description: "Eintrag wurde gespeichert." });
    setEditingEntry(null);
  };

  // ── Delete Entry Handler ──
  const handleDeleteEntry = (entry: TimeEntry) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'timeEntries', entry.id));
    toast({ title: "Gelöscht", description: "Eintrag wurde entfernt." });
  };

  const showSuccess = (msg: string) => {
    setSuccess(`Erfolgreich ${msg}!`);
    setIsProcessing(false);
    setTimeout(() => setSuccess(null), 3000);
  };

  // ── Computed: manual entry duration preview ──
  const manualDurationPreview = useMemo(() => {
    try {
      const clockIn = new Date(`${manualDate}T${manualStartTime}:00`);
      const clockOut = new Date(`${manualDate}T${manualEndTime}:00`);
      if (clockOut <= clockIn) return null;
      const breakMins = parseInt(manualBreakMins) || 0;
      const totalMins = differenceInMinutes(clockOut, clockIn);
      const netMins = Math.max(0, totalMins - breakMins);
      const h = Math.floor(netMins / 60);
      const m = netMins % 60;
      return { total: totalMins, net: netMins, label: `${h}h ${m}min` };
    } catch {
      return null;
    }
  }, [manualDate, manualStartTime, manualEndTime, manualBreakMins]);

  if (loadingInitial) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium mt-4">Lade dein Portal...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-slate-50">
        <Card className="p-8 max-w-sm w-full text-center rounded-3xl shadow-lg border-none bg-white">
          <Badge variant="destructive" className="mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-full">!</Badge>
          <h2 className="text-xl font-bold mb-2">Zugriff verweigert</h2>
          <p className="text-muted-foreground text-sm">Der Link ist ungültig oder der Mitarbeiter existiert nicht mehr.</p>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-6 text-center">
        <Card className="w-full max-w-sm p-12 rounded-3xl shadow-xl border-none bg-white animate-in zoom-in duration-300">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-800">{success}</h2>
        </Card>
      </div>
    );
  }

  // Calculated Stats
  const workedHoursThisMonth = timeEntriesMonth.reduce((acc, curr) => {
    if (curr.entryType === 'WORK' || !curr.entryType) {
      if (curr.clockInTime && curr.clockOutTime) {
        const ms = new Date(curr.clockOutTime).getTime() - new Date(curr.clockInTime).getTime();
        return acc + (ms / (1000 * 60 * 60));
      }
    }
    return acc;
  }, 0);

  const todaySchedule = upcomingSchedules.find(s => isSameDay(parseISO(s.date), new Date()));

  const historyToShow = showAllHistory ? recentWorkEntries : recentWorkEntries.slice(0, 7);

  return (
    <div className="min-h-[100dvh] bg-slate-50 pb-12">
      {/* Header */}
      <div className="bg-primary pt-12 pb-24 px-6 rounded-b-[2.5rem] shadow-sm relative">
        <div className="max-w-md mx-auto">
          <h1 className="text-primary-foreground/80 font-medium text-sm mb-1">Hallo,</h1>
          <h2 className="text-3xl font-bold text-white mb-6 truncate">{employee.fullName}</h2>
          
          <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20">
             <div className={`p-2 rounded-xl ${currentStatus === 'present' ? 'bg-green-400/20 text-green-300' : currentStatus === 'pause' ? 'bg-amber-400/20 text-amber-300' : 'bg-white/20 text-white'}`}>
                {currentStatus === 'present' ? <CheckCircle2 className="w-6 h-6" /> : currentStatus === 'pause' ? <Coffee className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
             </div>
             <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Aktueller Status</p>
                <p className="text-white font-bold text-lg">
                  {currentStatus === 'present' ? 'Du bist eingestempelt' : currentStatus === 'pause' ? 'Du bist in der Pause' : 'Du bist abwesend'}
                </p>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-14 space-y-6 relative z-10">
        
        {/* Actions Menu */}
        <Card className="rounded-3xl shadow-lg border-none overflow-hidden bg-white/95 backdrop-blur-xl">
          <CardContent className="p-4 space-y-3">
            {/* Location lock warning */}
            {locationBlocked && adminSettings?.locationLockEnabled && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-1">
                <Wifi className="w-8 h-8 text-amber-600 mx-auto" />
                <p className="font-bold text-amber-800 text-sm">Standort nicht erkannt</p>
                <p className="text-xs text-muted-foreground">
                  Stempeln ist nur aus dem Firmen-WLAN möglich.
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => handleClockAction('IN')}
                disabled={isProcessing || currentStatus === 'present'}
                className="h-20 rounded-2xl text-base font-bold flex-col gap-2 shadow-sm"
              >
                {isProcessing && currentStatus !== 'present' ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                Kommen
              </Button>
              <Button 
                onClick={() => setIsExitDialogOpen(true)}
                disabled={isProcessing || currentStatus !== 'present'}
                variant="outline"
                className="h-20 rounded-2xl text-base font-bold flex-col gap-2 shadow-sm border-2"
              >
                {isProcessing && currentStatus === 'present' ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                Gehen / Pause
              </Button>
            </div>

            {/* Manual Entry Button */}
            <Button 
              variant="outline"
              className="w-full h-14 rounded-2xl text-sm font-bold gap-3 border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all"
              onClick={() => setIsManualEntryOpen(true)}
            >
              <CalendarPlus className="w-5 h-5" />
              Arbeitszeit nachtragen
            </Button>
          </CardContent>
        </Card>

        {/* Today's Schedule Card */}
        {todaySchedule && (
          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5 flex items-start gap-4">
            <div className="bg-blue-500 text-white shrink-0 p-3 rounded-2xl shadow-inner">
              <CalendarCheck2 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-blue-900/60 text-xs font-bold uppercase tracking-wider mb-1">Dein Dienst heute</p>
              <p className="text-blue-950 font-bold text-lg">{todaySchedule.shiftStart} — {todaySchedule.shiftEnd} Uhr</p>
              {todaySchedule.breakStart && (
                <div className="inline-flex items-center gap-1.5 mt-2 text-xs text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full font-medium">
                  <Coffee className="w-3 h-3" />
                  Pause: {todaySchedule.breakStart}{todaySchedule.breakEnd ? `–${todaySchedule.breakEnd}` : ''} Uhr
                </div>
              )}
              {todaySchedule.note && <p className="text-sm text-blue-800 mt-1">{todaySchedule.note}</p>}
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <h3 className="font-bold text-slate-800 text-lg pt-4">Dein Zeitkonto</h3>
        <div className="grid grid-cols-2 gap-4">
          <Card className="rounded-3xl border-none shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800">{workedHoursThisMonth.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground font-medium">Gearbeitet dieser Monat</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-3xl border-none shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800">{employee.sickDays || 0}d</p>
                <p className="text-xs text-muted-foreground font-medium">Krankheitstage gesamt</p>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 rounded-3xl border-none shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Palmtree className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-800">{employee.vacationDays || 0} Tage</p>
                  <p className="text-sm text-muted-foreground font-medium">Resturlaub</p>
                </div>
              </div>
              <div className="text-right border-l pl-4">
                <p className="text-lg font-bold text-slate-700">{takenVacationDays} Tage</p>
                <p className="text-xs text-muted-foreground font-medium">Genommen</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Recent Work History ── */}
        <div className="flex items-center justify-between pt-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            Letzte Einträge
          </h3>
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold">
            {recentWorkEntries.length} Einträge
          </Badge>
        </div>
        <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0 divide-y divide-slate-100">
            {historyToShow.length > 0 ? (
              historyToShow.map((entry) => {
                const clockIn = parseISO(entry.clockInTime);
                const clockOut = entry.clockOutTime ? parseISO(entry.clockOutTime) : null;
                const durationMins = clockOut ? differenceInMinutes(clockOut, clockIn) : null;
                const hours = durationMins ? Math.floor(durationMins / 60) : null;
                const mins = durationMins ? durationMins % 60 : null;
                const isNachtrag = entry.sourceSystem?.includes('Nachtrag');

                return (
                  <div key={entry.id} className="p-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isNachtrag ? 'bg-violet-100 text-violet-600' : 'bg-primary/10 text-primary'}`}>
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-sm">
                          {format(clockIn, 'EEEE, dd. MMM', { locale: de })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(clockIn, 'HH:mm')} – {clockOut ? format(clockOut, 'HH:mm') : 'offen'}
                          {isNachtrag && (
                            <span className="ml-1.5 text-violet-500 font-semibold">• Nachtrag</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {durationMins !== null && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100 font-bold text-xs px-2.5 py-1">
                          {hours}h {String(mins).padStart(2, '0')}m
                        </Badge>
                      )}
                      {/* Edit & Delete only for manual (Nachtrag) entries */}
                      {isNachtrag && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingEntry(entry);
                              setEditDate(format(clockIn, 'yyyy-MM-dd'));
                              setEditStartTime(format(clockIn, 'HH:mm'));
                              setEditEndTime(clockOut ? format(clockOut, 'HH:mm') : '');
                            }}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Noch keine Arbeitszeiten erfasst.
              </div>
            )}
            {recentWorkEntries.length > 7 && (
              <button 
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="w-full p-3 text-center text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5"
              >
                {showAllHistory ? (
                  <>Weniger anzeigen <ChevronUp className="w-3.5 h-3.5" /></>
                ) : (
                  <>Alle {recentWorkEntries.length} Einträge anzeigen <ChevronDown className="w-3.5 h-3.5" /></>
                )}
              </button>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Schedules */}
        <h3 className="font-bold text-slate-800 text-lg pt-4">Kommende Schichten</h3>
        <Card className="rounded-3xl border-none shadow-sm bg-white">
          <CardContent className="p-0 divide-y divide-slate-100">
            {upcomingSchedules.length > 0 ? (
              upcomingSchedules.filter(s => !isSameDay(parseISO(s.date), new Date())).slice(0, 5).map((s) => (
                <div key={s.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{format(parseISO(s.date), 'EEEE, dd. MMMM', { locale: de })}</p>
                    {s.note && <p className="text-xs text-muted-foreground mt-0.5">{s.note}</p>}
                  </div>
                  <Badge variant="secondary" className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200">
                    {s.shiftStart} - {s.shiftEnd}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Keine weiteren Schichten eingetragen.
              </div>
            )}
            {upcomingSchedules.filter(s => !isSameDay(parseISO(s.date), new Date())).length > 5 && (
               <div className="p-3 text-center text-xs font-bold text-primary bg-primary/5 cursor-pointer hover:bg-primary/10 rounded-b-3xl">
                 Alle anzeigen
               </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ── Manual Entry Dialog ── */}
      <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
        <DialogContent className="rounded-3xl max-sm:w-[95vw] max-w-md border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-primary" />
              Arbeitszeit nachtragen
            </DialogTitle>
            <DialogDescription>
              Trage vergangene Arbeitstage und Zeiten manuell nach.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Date */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Datum</Label>
              <Input
                type="date"
                value={manualDate}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setManualDate(e.target.value)}
                className="rounded-xl h-12 text-base"
              />
            </div>

            {/* Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Beginn</Label>
                <Input
                  type="time"
                  value={manualStartTime}
                  onChange={(e) => setManualStartTime(e.target.value)}
                  className="rounded-xl h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Ende</Label>
                <Input
                  type="time"
                  value={manualEndTime}
                  onChange={(e) => setManualEndTime(e.target.value)}
                  className="rounded-xl h-12 text-base"
                />
              </div>
            </div>

            {/* Break */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Pause (Minuten)</Label>
              <Input
                type="number"
                min="0"
                max="120"
                value={manualBreakMins}
                onChange={(e) => setManualBreakMins(e.target.value)}
                placeholder="30"
                className="rounded-xl h-12 text-base"
              />
            </div>

            {/* Duration Preview */}
            {manualDurationPreview && (
              <div className="bg-gradient-to-r from-primary/5 to-violet-50 border border-primary/10 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Nettoarbeitszeit</p>
                    <p className="text-lg font-black text-slate-800">{manualDurationPreview.label}</p>
                  </div>
                </div>
                {parseInt(manualBreakMins) > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Pause</p>
                    <p className="text-sm font-bold text-amber-600">{manualBreakMins} min</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="ghost" 
              onClick={() => setIsManualEntryOpen(false)} 
              className="rounded-xl"
            >
              Abbrechen
            </Button>
            <Button 
              onClick={handleAddManualEntry}
              disabled={isManualSaving || !manualDurationPreview}
              className="rounded-xl gap-2 px-6"
            >
              {isManualSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Eintragen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Entry Dialog ── */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="rounded-3xl max-sm:w-[95vw] max-w-md border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Eintrag bearbeiten
            </DialogTitle>
            <DialogDescription>
              Passe die Arbeitszeit für diesen Eintrag an.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Datum</Label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="rounded-xl h-12 text-base"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Beginn</Label>
                <Input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="rounded-xl h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Ende</Label>
                <Input
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  className="rounded-xl h-12 text-base"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setEditingEntry(null)} className="rounded-xl">Abbrechen</Button>
            <Button onClick={handleEditEntry} className="rounded-xl gap-2 px-6">
              <CheckCircle2 className="w-4 h-4" /> Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Dialog */}
      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent className="rounded-3xl max-sm:w-[95vw] max-w-sm border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Abmeldung bestätigen</DialogTitle>
            <DialogDescription>Möchtest du eine Pause machen oder ist dies dein Feierabend?</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-4">
            <Button 
              variant="outline" 
              className="h-16 rounded-2xl justify-start px-6 gap-4 border-2 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors"
              onClick={() => handleClockAction('OUT', 'PAUSE')}
            >
              <Coffee className="w-5 h-5 text-amber-500" />
              <span className="text-base">Ich mache Pause</span>
            </Button>
            <Button 
              className="h-16 rounded-2xl justify-start px-6 gap-4"
              onClick={() => handleClockAction('OUT', 'END')}
            >
              <Moon className="w-5 h-5" />
              <span className="text-base text-left flex-1">Ich habe Feierabend</span>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsExitDialogOpen(false)} className="w-full rounded-xl">Abbrechen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EmployeeAppWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <MAAppContent id={id} />
    </Suspense>
  );
}
