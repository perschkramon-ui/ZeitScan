'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { QRCode } from '@/components/qr-code';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Printer, Loader2, Mail, Lock, LogOut, ExternalLink } from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const authPromise = isLogin 
      ? signInWithEmailAndPassword(auth, email, password)
      : createUserWithEmailAndPassword(auth, email, password);

    authPromise
      .catch((err: any) => {
        toast({
          title: "Authentifizierungsfehler",
          description: err.message || "Vorgang fehlgeschlagen.",
          variant: "destructive"
        });
        setIsLoading(false);
      });
  };

  if (isUserLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (user && !user.isAnonymous) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#E8EAEF] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <CardHeader className="bg-primary p-8 text-primary-foreground text-center">
          <CardTitle className="text-2xl font-bold">ZeitScan Admin</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Bitte melden Sie sich an, um Ihr Terminal zu konfigurieren.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-Mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="name@firma.de" 
                  className="pl-10 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Anmelden' : 'Registrieren')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="p-8 pt-0 flex flex-col gap-4">
          <Button variant="ghost" className="w-full" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Noch kein Konto? Jetzt registrieren' : 'Bereits ein Konto? Hier anmelden'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function ScanContent() {
  const [portalUrl, setPortalUrl] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    if (user && !user.isAnonymous) {
      const url = window.location.origin + '/portal?adminId=' + user.uid;
      setPortalUrl(url);
    }
  }, [user]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleLogout = () => {
    setIsLogoutLoading(true);
    signOut(auth)
      .catch((err: any) => {
        toast({
          title: "Fehler beim Abmelden",
          description: "Bitte versuchen Sie es erneut.",
          variant: "destructive"
        });
      })
      .finally(() => {
        setIsLogoutLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-6 items-center print:p-0 print:bg-white print:justify-center">
      <div className="max-w-xl w-full">
        <div className="flex justify-between items-center mb-8 print:hidden">
          <Link href="/admin/dashboard" className="inline-flex items-center text-primary font-medium hover:underline transition-all">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Dashboard
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isLogoutLoading} className="text-muted-foreground hover:text-destructive">
            {isLogoutLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
            Abmelden
          </Button>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden text-center border-t-8 border-primary print:shadow-none print:border-none print:w-full">
          <div className="p-8 print:p-0">
            <h1 className="text-3xl font-headline font-bold text-foreground mb-2 print:text-4xl">ZeitScan Terminal</h1>
            <p className="text-muted-foreground mb-8 print:text-lg">
              Klicken oder scannen Sie den Code, um zum Portal zu gelangen.
            </p>

            <div className="flex justify-center mb-8 min-h-[300px] items-center print:mb-12">
              {isMounted && portalUrl ? (
                <Link 
                  href={portalUrl} 
                  target="_blank" 
                  className="group relative transform hover:scale-105 transition-transform duration-300 print:transform-none"
                >
                  <QRCode value={portalUrl} size={300} />
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                    <ExternalLink className="w-12 h-12 text-primary" />
                  </div>
                </Link>
              ) : (
                <div className="flex flex-col items-center gap-2 print:hidden">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Generiere QR-Code...</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center print:hidden">
              <Button 
                variant="outline" 
                className="rounded-xl flex-1 h-12 gap-2"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4" />
                Drucken
              </Button>
            </div>
          </div>
          
          <div className="bg-primary/5 p-4 border-t border-dashed border-primary/20 print:hidden">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Terminal-Link aktiv</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <AuthGate>
        <ScanContent />
      </AuthGate>
    </Suspense>
  );
}
