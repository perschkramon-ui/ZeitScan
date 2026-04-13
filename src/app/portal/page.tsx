
"use client";

import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, AlertCircle, LogIn, LogOut, Loader2, Coffee, Moon, CalendarCheck2, ShieldX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking,
  useUser,
  useAuth
} from '@/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import type { Employee, TimeEntry, ScheduleEntry } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

function PortalContent() {
  const searchParams = useSearchParams();
  const adminId = searchParams.get('adminId');
  
  const { user, isUserLoading: isAuthLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [selectedId, setSelectedId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'present' | 'pause' | 'absent'>('absent');
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);

  // Today's date string for schedule lookup
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Auto-login anonymously if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user && auth) {
      signInAnonymously(auth).catch((err) => {
        console.error("Anonymous sign-in failed:", err);
        toast({
          title: "Terminal-Fehler",
          description: "Anmeldung am Terminal fehlgeschlagen. Bitte Cookies prüfen.",
          variant: "destructive"
        });
      });
    }
  }, [user, isAuthLoading, auth, toast]);

  const employeesQuery = useMemoFirebase(() => {
    if (!firestore || !adminId || !user) return null;
    return query(
      collection(firestore, 'employees'), 
      where('adminId', '==', adminId), 
      where('isArchived', '==', false)
    );
  }, [firestore, adminId, user]);

  const { data: employees, isLoading: employeesLoading } = useCollection<Employee>(employeesQuery);

  // Load today's schedule entries for this admin
  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore || !adminId || !user) return null;
    return query(
      collection(firestore, 'schedules'),
      where('adminId', '==', adminId),
      where('date', '==', todayStr)
    );
  }, [firestore, adminId, user, todayStr]);

  const { data: todaySchedules, isLoading: schedulesLoading } = useCollection<ScheduleEntry>(schedulesQuery);

  // Load ALL schedules for this admin (to detect if the feature is being actively used)
  const allSchedulesQuery = useMemoFirebase(() => {
    if (!firestore || !adminId || !user) return null;
    return query(
      collection(firestore, 'schedules'),
      where('adminId', '==', adminId)
    );
  }, [firestore, adminId, user]);

  const { data: allSchedules } = useCollection<ScheduleEntry>(allSchedulesQuery);

  // Schedule feature is considered "active" only if admin has ever created any entries
  const scheduleFeatureActive = (allSchedules?.length ?? 0) > 0;

  // Check if the selected employee is scheduled for today
  const selectedEmployeeSchedule = selectedId
    ? (todaySchedules || []).find(s => s.employeeId === selectedId)
    : null;

  // Allow clock-in if: feature not active OR employee is in today's schedule
  const isScheduledToday = !scheduleFeatureActive || !!selectedEmployeeSchedule;

  useEffect(() => {
    if (!selectedId || !firestore || !adminId || !user) {
      setActiveEntryId(null);
      setCurrentStatus('absent');
      return;
    }

    setIsStatusLoading(true);
    const q = query(
      collection(firestore, 'timeEntries'), 
      where('employeeId', '==', selectedId),
      where('adminId', '==', adminId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as TimeEntry));
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
      setIsStatusLoading(false);
    }, (error) => {
      console.error("Status check failed:", error);
      setIsStatusLoading(false);
    });

    return () => unsubscribe();
  }, [selectedId, firestore, adminId, user]);

  const handleClockAction = (action: 'IN' | 'OUT', exitType?: 'PAUSE' | 'END') => {
    if (!selectedId || !firestore || !adminId) return;

    // Schedule enforcement: block clock-in if not scheduled today
    if (action === 'IN' && !isScheduledToday) {
      toast({
        title: "Nicht im Dienstplan",
        description: "Sie sind heute nicht im Dienstplan eingetragen und können nicht einstempeln.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    const employee = employees?.find(e => e.id === selectedId);

    if (!employee) {
      setIsProcessing(false);
      return;
    }

    if (action === 'IN') {
      let clockInTime = new Date();
      let successMsg = 'eingestempelt';

      if (scheduleFeatureActive && selectedEmployeeSchedule) {
        const [startHour, startMinute] = selectedEmployeeSchedule.shiftStart.split(':').map(Number);
        const scheduledTime = new Date();
        scheduledTime.setHours(startHour, startMinute, 0, 0);

        // Vorzeitiges Einstempeln
        if (clockInTime < scheduledTime) {
          clockInTime = scheduledTime;
          successMsg = `eingestempelt (Dienstbeginn auf ${selectedEmployeeSchedule.shiftStart} Uhr angepasst)`;
        }
      }

      const entryData = {
        adminId: adminId,
        employeeId: employee.id,
        employeeName: employee.fullName,
        clockInTime: clockInTime.toISOString(),
        clockOutTime: null,
        sourceSystem: 'Terminal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      addDocumentNonBlocking(collection(firestore, 'timeEntries'), entryData)
        .then(() => {
          showSuccess(successMsg);
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

  const showSuccess = (msg: string) => {
    setSuccess(`Erfolgreich ${msg}!`);
    setIsProcessing(false);
    setTimeout(() => {
      setSuccess(null);
      setSelectedId('');
    }, 3000);
  };

  if (!adminId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <Card className="p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold">Ungültiger Terminal-Link</h2>
          <p>Bitte scannen Sie den offiziellen QR-Code erneut.</p>
        </Card>
      </div>
    );
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E8EAEF]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">Terminal wird vorbereitet...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#E8EAEF] flex items-center justify-center p-6 text-center">
        <Card className="w-full max-w-md p-12 rounded-3xl animate-in zoom-in duration-300">
          <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-2">{success}</h2>
          <p className="text-muted-foreground">Bereit für nächsten Scan...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8EAEF] flex flex-col items-center justify-center p-6">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-2xl font-bold">ZeitScan Terminal</h1>
        </div>
      </header>

      <Card className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <CardHeader className="bg-primary p-8 text-primary-foreground">
          <CardTitle>Willkommen</CardTitle>
          <CardDescription className="text-primary-foreground/80">Wählen Sie Ihren Namen aus.</CardDescription>
        </CardHeader>
        
        <CardContent className="p-8 space-y-6">
          <Select onValueChange={setSelectedId} value={selectedId}>
            <SelectTrigger className="h-14 rounded-xl text-lg">
              {employeesLoading ? "Lade Mitarbeiter..." : <SelectValue placeholder="Name wählen..." />}
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {employees?.map(e => (
                <SelectItem key={e.id} value={e.id} className="h-12 text-lg">
                  {e.fullName}
                </SelectItem>
              ))}
              {employees?.length === 0 && !employeesLoading && (
                <div className="p-4 text-center text-sm text-muted-foreground">Keine aktiven Mitarbeiter gefunden.</div>
              )}
            </SelectContent>
          </Select>

          {/* Status & Schedule Badge area */}
          {selectedId && !isStatusLoading && (
            <div className="flex flex-col items-center gap-2">
              <Badge 
                variant={currentStatus === 'present' ? "default" : currentStatus === 'pause' ? "secondary" : "outline"} 
                className={`px-4 py-1.5 rounded-full ${currentStatus === 'pause' ? 'bg-amber-100 text-amber-700 border-amber-200' : ''}`}
              >
                {currentStatus === 'present' ? 'Anwesend' : currentStatus === 'pause' ? 'In Pause' : 'Abwesend'}
              </Badge>

              {/* Dienstplan status pill */}
              {scheduleFeatureActive && selectedId && !schedulesLoading && (
                selectedEmployeeSchedule ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                      <CalendarCheck2 className="w-3.5 h-3.5" />
                      <span>
                        Dienstplan: {selectedEmployeeSchedule.shiftStart}–{selectedEmployeeSchedule.shiftEnd} Uhr
                      </span>
                    </div>
                    {selectedEmployeeSchedule.breakStart && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                        <Coffee className="w-3 h-3" />
                        <span>Pause: {selectedEmployeeSchedule.breakStart}{selectedEmployeeSchedule.breakEnd ? `–${selectedEmployeeSchedule.breakEnd}` : ''} Uhr</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-full border border-destructive/20">
                    <ShieldX className="w-3.5 h-3.5" />
                    <span>Heute nicht im Dienstplan</span>
                  </div>
                )
              )}
            </div>
          )}

          {/* Blocked state card — shown when employee is not scheduled and not already present */}
          {selectedId && scheduleFeatureActive && !schedulesLoading && !selectedEmployeeSchedule && currentStatus !== 'present' && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 text-center space-y-2">
              <ShieldX className="w-10 h-10 text-destructive mx-auto" />
              <p className="font-bold text-destructive">Einstempeln gesperrt</p>
              <p className="text-sm text-muted-foreground">
                Sie stehen heute (<strong>{format(new Date(), 'dd.MM.yyyy', { locale: de })}</strong>) nicht im Dienstplan.
                Bitte wenden Sie sich an Ihren Vorgesetzten.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => handleClockAction('IN')}
              disabled={
                isProcessing ||
                !selectedId ||
                currentStatus === 'present' ||
                (scheduleFeatureActive && !isScheduledToday && !schedulesLoading)
              }
              className="h-24 rounded-2xl text-lg font-bold gap-2 flex-col"
            >
              {isProcessing && currentStatus !== 'present' ? <Loader2 className="animate-spin" /> : <LogIn />}
              Kommen
            </Button>
            <Button 
              onClick={() => setIsExitDialogOpen(true)}
              disabled={isProcessing || !selectedId || currentStatus !== 'present'}
              variant="outline"
              className="h-24 rounded-2xl text-lg font-bold gap-2 flex-col"
            >
              {isProcessing && currentStatus === 'present' ? <Loader2 className="animate-spin" /> : <LogOut />}
              Gehen
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent className="rounded-2xl max-sm:w-[95vw] max-w-sm">
          <DialogHeader>
            <DialogTitle>Abmeldung bestätigen</DialogTitle>
            <DialogDescription>Möchten Sie eine Pause machen oder ist dies Ihr Feierabend?</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-4">
            <Button 
              variant="outline" 
              className="h-14 rounded-xl justify-start px-6 gap-4"
              onClick={() => handleClockAction('OUT', 'PAUSE')}
            >
              <Coffee className="w-5 h-5 text-amber-600" />
              <span>Ich mache Pause</span>
            </Button>
            <Button 
              className="h-14 rounded-xl justify-start px-6 gap-4"
              onClick={() => handleClockAction('OUT', 'END')}
            >
              <Moon className="w-5 h-5" />
              <span>Ich habe Feierabend</span>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsExitDialogOpen(false)} className="w-full">Abbrechen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EmployeePortal() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Lade Terminal...</div>}>
      <PortalContent />
    </Suspense>
  );
}
