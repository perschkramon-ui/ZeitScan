import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { QrCode, ShieldCheck } from 'lucide-react';
import { PWAInstallButton } from '@/components/pwa-install-button';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 sm:p-24 relative overflow-hidden">
      <header className="mb-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">ZeitScan</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Die professionelle Lösung für moderne Arbeitszeiterfassung per QR-Code.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm group">
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <QrCode className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="font-headline">Mitarbeiter-Portal</CardTitle>
            <CardDescription>
              Scannen Sie den QR-Code, um Ihre Arbeitszeit zu stempeln.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/scan" className="w-full">
              <Button className="w-full h-12 text-lg rounded-xl font-medium shadow-md">
                QR-Code Anzeigen
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm group">
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <ShieldCheck className="w-6 h-6 text-accent" />
            </div>
            <CardTitle className="font-headline">Administrator</CardTitle>
            <CardDescription>
              Verwalten Sie Arbeitszeiten und erhalten Sie AI-basierte Insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/dashboard" className="w-full">
              <Button variant="outline" className="w-full h-12 text-lg rounded-xl font-medium border-2 hover:bg-accent/5">
                Dashboard öffnen
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-16 text-muted-foreground text-sm">
        &copy; {new Date().getFullYear()} ZeitScan Arbeitszeiterfassung. Alle Rechte vorbehalten.
      </footer>

      {/* PWA Install Button / Banner */}
      <PWAInstallButton />
    </div>
  );
}
