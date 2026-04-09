# Sicherheits- und Android-Kompatibilitäts-Updates

## Übersicht der durchgeführten Änderungen

Diese Dokumentation beschreibt die Sicherheits- und Kompatibilitäts-Updates für ZeitScan, um die "Unsichere App Blockiert"-Fehlermeldungen auf neueren Android-Versionen zu beheben.

## Problem
Android 12+ und neuere iOS/iPadOS-Versionen zeigen eine Warnung "Unsichere App Blockiert" für PWAs, die alte Sicherheits- und Datenschutz-Standards nicht erfüllen.

## Gelöste Probleme

### 1. **Manifest-Konfiguration** (`src/app/manifest.ts`)
- ✅ Hinzufügen von `scope` und `orientation`
- ✅ Separate Icons für `any` und `maskable` purpose (erforderlich für Android 12+)
- ✅ `categories` für Google Play Compliance
- ✅ `screenshots` für bessere App-Vorschau
- ✅ `shortcuts` für Quick Actions
- ✅ Entfernen von ungültiger purpose-Syntax ("any maskable" → separate Einträge)

### 2. **Service Worker** (`public/sw.js`)
- ✅ Moderne Caching-Strategie (Network-First für APIs, Cache-First für Assets)
- ✅ Ordnungsgemäße Cache-Verwaltung
- ✅ Fehlerbehandlung und Offline-Support
- ✅ Sichere Fetch-Interception

### 3. **Security Headers** (`next.config.ts`)
- ✅ Content-Security-Policy (CSP) mit härtesten Einstellungen
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: SAMEORIGIN
- ✅ X-XSS-Protection
- ✅ Referrer-Policy
- ✅ Permissions-Policy (Microphone, Camera, Geolocation deaktiviert)

### 4. **Meta Tags und Metadaten** (`src/app/layout.tsx`)
- ✅ Zusätzliche mobile Meta Tags für Android-Kompatibilität
- ✅ Apple Web App Meta Tags
- ✅ Microsoft/Windows Meta Tags
- ✅ OpenGraph Tags für Social Sharing
- ✅ Privacy Policy und Terms of Service Links
- ✅ Canonical URLs

### 5. **Privacy & Legal Pages**
- ✅ `/privacy` - Umfassende Datenschutzerklärung (DSGVO-konform)
- ✅ `/terms` - Ausführliche Nutzungsbedingungen
- ✅ Verlinkt in Manifest und HTML Head

### 6. **Offline Experience**
- ✅ `public/offline.html` - Benutzerfreundliche Offline-Fallback-Seite
- ✅ Service Worker zeigt diese Seite bei Offline-Zustand

### 7. **Browser Configuration**
- ✅ `public/browserconfig.xml` - Windows/Microsoft-Konfiguration

## Detaillierte Änderungen

### Datei: `src/app/manifest.ts`
```typescript
// Hinzugefügt:
- scope: '/' (definiert Navigations-Scope)
- orientation: 'portrait-primary' (vorgegebene Orientierung)
- categories: ['productivity', 'business'] (für App Stores)
- prefer_related_applications: false
- Separate maskable Icons (Android 12+ Anforderung)
- screenshots Array (für bessere Vorschau)
- shortcuts Array (Quick Actions)
```

### Datei: `public/sw.js`
Komplette Neuschreibung mit:
- Cache-Namen-Verwaltung
- Network-First für APIs
- Cache-First für statische Assets
- Graceful offline handling
- Fehlerbehandlung

### Datei: `next.config.ts`
Hinzufügen von:
- `async headers()` Funktion mit Security Headers
- Content-Security-Policy mit Firebase-URLs
- Geolocation und Camera Permissions deaktiviert

### Datei: `src/app/layout.tsx`
Erweiterte Meta Tags:
- `application-name` und `apple-mobile-web-app-title`
- `msapplication-*` für Windows-Apps
- `theme-color` mit prefers-color-scheme
- Privacy Policy und Terms Links
- Canonical URL

## Testing und Validierung

### PWA Audit durchführen:
1. Chrome/Edge DevTools → Lighthouse
2. Lighthouse PWA Audit ausführen
3. Alle Checks sollten grün sein

### Android Test:
1. App auf Android 12+ Gerät/Emulator öffnen
2. Installation anbieten (sollte keine Warnung zeigen)
3. Service Worker registrieren bestätigen (DevTools Console)
4. Offline-Test durchführen (DevTools → Network offline)

### iOS Test:
1. App in Safari öffnen
2. "Teilen" → "Zum Home-Bildschirm" testen
3. App vom Home-Screen starten

## Wichtige URLs für die Produktion

Diese URLs müssen auf Ihrer Domain verfügbar sein:
- `https://yourdomain.com/manifest.webmanifest`
- `https://yourdomain.com/sw.js`
- `https://yourdomain.com/privacy`
- `https://yourdomain.com/terms`
- `https://yourdomain.com/icon-192x192.png`
- `https://yourdomain.com/icon-512x512.png`
- `https://yourdomain.com/offline.html`

## HTTPS ist erforderlich
⚠️ **WICHTIG**: PWAs funktionieren NUR über HTTPS in der Produktion!

## Zukünftige Verbesserungen

1. **Biometrische Authentifizierung** für iOS/Android
2. **Push Notifications** über Web Push API
3. **Background Sync** für Offline-Daten
4. **File Sharing Target** Integration
5. **Musik-Player Shortcuts**

## Support und Debugging

### Chrome DevTools:
- Application Tab → Manifest: Validierung prüfen
- Application Tab → Service Workers: Registration Status
- Console: Fehler und Warnungen
- Lighthouse: PWA Score

### Häufige Fehler:

| Fehler | Lösung |
|--------|--------|
| Service Worker registriert nicht | Prüfen Sie HTTPS, Pfad zu sw.js, Browser Console |
| "Unsichere App" Warnung bleibt | Cache leeren, App neu installieren |
| Icons zeigen nicht | Prüfe Manifest purpose, Icon-Größen, MIME-Types |
| Offline-Seite zeigt nicht | Service Worker > Fetch Event Log prüfen |

## Version
- Datum: April 2026
- Version: 1.0
- Status: Production Ready

## Weitere Ressourcen
- MDN Web Docs: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/
- Google PWA Checklist: https://web.dev/pwa-checklist/
- Android App Security: https://developer.android.com/privacy-and-security
- DSGVO Compliance: https://gdpr-info.eu/