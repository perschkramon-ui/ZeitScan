import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nutzungsbedingungen | ZeitScan',
  description: 'Nutzungsbedingungen der ZeitScan App',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-8 text-slate-900">Nutzungsbedingungen</h1>
        
        <div className="prose prose-sm max-w-none text-slate-700 space-y-6">
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900">1. Akzeptanz der Bedingungen</h2>
            <p>
              Durch die Nutzung dieser App akzeptieren Sie vollständig diese Nutzungsbedingungen. 
              Wenn Sie nicht zustimmen, nutzen Sie die App bitte nicht.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900">2. Lizenz und Nutzungsrechte</h2>
            <p>
              Die App wird unter Lizenz bereitgestellt. Sie dürfen die App nur für persönliche 
              oder geschäftliche Zwecke gemäß dieser Bedingungen nutzen. 
              Sie dürfen die App nicht verteilen, verändern oder als Ihre eigene ausgeben.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900">3. Benutzerverantwortung</h2>
            <p>Sie sind verantwortlich für:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Die Sicherheit Ihrer Anmeldedaten</li>
              <li>Alle Aktivitäten unter Ihrem Konto</li>
              <li>Die Genauigkeit der eingegebenen Daten</li>
              <li>Die Einhaltung aller geltenden Gesetze</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900">4. Verbotene Aktivitäten</h2>
            <p>Sie dürfen nicht:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Die App hacken, dekompilieren oder manipulieren</li>
              <li>Unbefugte Zugriffe durchführen</li>
              <li>Malware oder Schadsoftware verwenden</li>
              <li>Die App zu illegalen Zwecken nutzen</li>
              <li>Andere Nutzer belästigen oder bedrohen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900">5. Haftungsausschluss</h2>
            <p>
              Die App wird "wie besehen" bereitgestellt. Wir lehnen alle Gewährleistungen ab, 
              einschließlich der Gewährleistung für Handelsüblichkeit oder Eignung für einen bestimmten Zweck. 
              Wir haften nicht für Verluste oder Schäden, die durch die Nutzung entstehen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900">6. Änderungen und Verfügbarkeit</h2>
            <p>
              Wir können die App jederzeit ändern, aktualisieren oder einstellen. 
              Wir sind nicht verpflichtet, die App kontinuierlich bereitzustellen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900">7. Kündigung</h2>
            <p>
              Wir können Ihren Zugriff auf die App beenden, wenn Sie gegen diese Bedingungen verstoßen. 
              Sie können Ihren Account jederzeit löschen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4 text-slate-900">8. Änderungen dieser Bedingungen</h2>
            <p>
              Wir können diese Bedingungen jederzeit aktualisieren. 
              Die Nutzung nach Änderungen bedeutet Ihre Zustimmung.
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