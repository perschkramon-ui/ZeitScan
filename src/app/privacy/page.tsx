import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung | ZeitScan',
  description: 'Datenschutzerklärung der ZeitScan App',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-8 text-slate-900">Datenschutzerklärung</h1>
        
        <div className="prose prose-sm max-w-none text-slate-700 space-y-6">
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900">1. Verantwortlicher</h2>
            <p>
              Für die Datenverarbeitung in dieser App ist der Betreiber verantwortlich. 
              Bei Fragen kontaktieren Sie uns bitte über die in der App angegebenen Kontaktinformationen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900">2. Erhobene Daten</h2>
            <p>Wir erheben und verarbeiten folgende Daten:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Authentifizierungsdaten (E-Mail, Passwort)</li>
              <li>Zeiterfassungsdaten (Scan-Zeiten, QR-Code Daten)</li>
              <li>Geräte- und Nutzungsinformationen</li>
              <li>Firebase Analytics Daten</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900">3. Datenspeicherung</h2>
            <p>
              Ihre Daten werden verschlüsselt über Firebase gespeichert. 
              Wir halten uns an Google's Datenschutzrichtlinien und DSGVO-Anforderungen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900">4. Benutzerrechte</h2>
            <p>Sie haben das Recht auf:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Auskunft über Ihre Daten</li>
              <li>Berichtigung falscher Daten</li>
              <li>Löschung Ihrer Daten</li>
              <li>Datenportabilität</li>
              <li>Widerspruch zur Datenverarbeitung</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900">5. Sicherheit</h2>
            <p>
              Wir setzen moderne Sicherheitsmaßnahmen ein, um Ihre Daten zu schützen. 
              Dazu gehören Verschlüsselung, sichere Authentifizierung und regelmäßige Sicherheitsüberprüfungen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900">6. Cookies und Tracking</h2>
            <p>
              Diese App verwendet keine Cookies für Tracking-Zwecke. 
              Firebase Analytics kann pseudonymisierte Nutzungsdaten erfassen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900">7. Änderungen dieser Richtlinie</h2>
            <p>
              Wir können diese Datenschutzerklärung jederzeit aktualisieren. 
              Änderungen werden in der App veröffentlicht.
            </p>
          </section>

          <div className="mt-12 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-slate-600">
              Letzte Aktualisierung: {new Date().toLocaleDateString('de-DE')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}