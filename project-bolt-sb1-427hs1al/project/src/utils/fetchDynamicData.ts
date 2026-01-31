import { DynamicSelectionData, WebhookResponse } from '../types';

/* =========================
   Configuration & Validation
========================= */
const MAKE_WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL || '';
const FETCH_TIMEOUT_MS = 30000;

function validateWebhookUrl(): string {
  console.log('═══════════════════════════════');
  console.log('🔍 WEBHOOK URL VALIDIERUNG');
  console.log('═══════════════════════════════');
  console.log('URL:', MAKE_WEBHOOK_URL);
  console.log('Länge:', MAKE_WEBHOOK_URL.length);
  console.log('───────────────────────────────');

  if (!MAKE_WEBHOOK_URL || MAKE_WEBHOOK_URL.trim() === '') {
    throw new Error(
      'Make Webhook-URL ist nicht konfiguriert. Bitte setzen Sie VITE_MAKE_WEBHOOK_URL in der .env Datei.'
    );
  }

  if (
    MAKE_WEBHOOK_URL.includes('DEIN_HTTP_ENDPOINT') ||
    MAKE_WEBHOOK_URL.includes('YOUR_ENDPOINT') ||
    MAKE_WEBHOOK_URL.includes('PLACEHOLDER')
  ) {
    throw new Error(
      'Make Webhook-URL ist ein Platzhalter. Bitte ersetzen Sie die URL in der .env Datei mit Ihrer echten Make HTTP-Endpoint URL.'
    );
  }

  if (!MAKE_WEBHOOK_URL.startsWith('http://') && !MAKE_WEBHOOK_URL.startsWith('https://')) {
    throw new Error(
      'Make Webhook-URL muss mit http:// oder https:// beginnen.'
    );
  }

  console.log('✅ URL ist valide');
  console.log('═══════════════════════════════');
  return MAKE_WEBHOOK_URL;
}

function checkNetworkStatus(): void {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    if (!navigator.onLine) {
      throw new Error(
        'Keine Internetverbindung. Bitte überprüfen Sie Ihre Netzwerkverbindung.'
      );
    }
  }
}

/* =========================
   Helper: Safe JSON Parse
========================= */
function safeJsonParse(text: string) {
  const trimmed = text.trim();

  console.log('═══════════════════════════════');
  console.log('🔄 JSON PARSE VORGANG');
  console.log('═══════════════════════════════');
  console.log('Raw Response (Länge):', text.length);
  console.log('Trimmed Response (Länge):', trimmed.length);

  if (!trimmed) {
    console.error('❌ Leere Response');
    console.log('═══════════════════════════════');
    throw new Error(
      'Leere Response von Make. Der Webhook hat keine Daten zurückgegeben.'
    );
  }

  console.log('Preview (erste 200 Zeichen):', trimmed.slice(0, 200));
  console.log('───────────────────────────────');

  try {
    const parsed = JSON.parse(trimmed);
    console.log('✅ JSON erfolgreich geparst');
    console.log('Type:', typeof parsed);
    console.log('Keys:', Object.keys(parsed || {}));
    console.log('═══════════════════════════════');
    return parsed;
  } catch (error) {
    console.error('❌ JSON PARSE FEHLER');
    console.error('Error:', error);
    console.error('Komplette Raw Response:', text);
    console.error('═══════════════════════════════');

    const preview = trimmed.slice(0, 200);
    throw new Error(
      `Response ist kein valides JSON. Die Make-Response konnte nicht geparst werden. Preview: "${preview}${trimmed.length > 200 ? '...' : ''}"`
    );
  }
}

/* =========================
   Helper: Fetch with Timeout
========================= */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  console.log('═══════════════════════════════');
  console.log('🌐 FETCH REQUEST');
  console.log('═══════════════════════════════');
  console.log('URL:', url);
  console.log('Method:', options.method);
  console.log('Timeout:', `${timeoutMs}ms`);
  console.log('Body:', options.body);
  console.log('───────────────────────────────');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error('⏱️ TIMEOUT - Request abgebrochen');
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('📥 RESPONSE ERHALTEN');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('OK:', response.ok);
    console.log('Content-Type:', response.headers.get('content-type'));
    console.log('═══════════════════════════════');

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    console.error('═══════════════════════════════');
    console.error('❌ FETCH FEHLER');
    console.error('═══════════════════════════════');
    console.error('Error:', error);
    console.error('Error Type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error Message:', error instanceof Error ? error.message : String(error));
    console.error('═══════════════════════════════');

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(
          `Request Timeout: Der Make-Webhook hat nicht innerhalb von ${timeoutMs / 1000} Sekunden geantwortet. Bitte versuchen Sie es erneut.`
        );
      }

      if (error.message.includes('Failed to fetch')) {
        throw new Error(
          'Netzwerk-Fehler: Der Make-Webhook konnte nicht erreicht werden. Mögliche Ursachen:\n' +
          '• Die Make-URL ist falsch konfiguriert\n' +
          '• Der Make-Webhook ist nicht aktiv\n' +
          '• CORS-Problem (Make-Webhook muss CORS-Header senden)\n' +
          '• Firewall blockiert die Anfrage\n\n' +
          `Webhook URL: ${url}`
        );
      }
    }

    throw error;
  }
}

/* =========================
   REGAL-AUSWAHL (Start)
========================= */
export async function fetchDynamicDataFromMake(): Promise<DynamicSelectionData> {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║  🚀 FETCH DYNAMIC DATA FROM MAKE              ║');
  console.log('╚═══════════════════════════════════════════════╝');

  try {
    checkNetworkStatus();
    const url = validateWebhookUrl();

    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_regale' }),
      },
      FETCH_TIMEOUT_MS
    );

    const text = await response.text();

    if (!response.ok) {
      throw new Error(
        `HTTP Fehler ${response.status}: ${response.statusText}\n\nResponse: ${text.slice(0, 500)}`
      );
    }

    const data = safeJsonParse(text);

    if (!data || typeof data !== 'object') {
      throw new Error(
        'Ungültiges Response-Format: Response ist kein Objekt'
      );
    }

    if (!Array.isArray(data.items)) {
      throw new Error(
        'Ungültiges Response-Format: Make JSON enthält kein items[] Array'
      );
    }

    console.log('✅ SUCCESS - Dynamic Data geladen');
    console.log('Items:', data.items.length);
    console.log('═══════════════════════════════');

    return data as DynamicSelectionData;
  } catch (error) {
    console.error('╔═══════════════════════════════════════════════╗');
    console.error('║  ❌ FEHLER: fetchDynamicDataFromMake          ║');
    console.error('╚═══════════════════════════════════════════════╝');
    console.error(error);
    throw error;
  }
}

/* =========================
   MATRIX / DETAILS
========================= */
export async function fetchRegalDataFromMake(
  filePath?: string
): Promise<WebhookResponse> {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║  🚀 FETCH REGAL DATA FROM MAKE                ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log('File Path:', filePath || 'none');
  console.log('───────────────────────────────');

  try {
    checkNetworkStatus();
    const url = validateWebhookUrl();

    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_regale',
          ...(filePath ? { filePath } : {}),
        }),
      },
      FETCH_TIMEOUT_MS
    );

    const text = await response.text();

    if (!response.ok) {
      throw new Error(
        `HTTP Fehler ${response.status}: ${response.statusText}\n\nResponse: ${text.slice(0, 500)}`
      );
    }

    const data = safeJsonParse(text);

    if (!data || typeof data !== 'object') {
      throw new Error(
        'Ungültiges Response-Format: Response ist kein Objekt'
      );
    }

    if (!data.view) {
      throw new Error(
        'Ungültiges Response-Format: Make JSON enthält kein view-Feld'
      );
    }

    console.log('✅ SUCCESS - Regal Data geladen');
    console.log('View:', data.view);
    if (data.view === 'regal-auswahl') {
      console.log('Items:', data.items?.length || 0);
    } else if (data.view === 'pruef-matrix') {
      console.log('Abschnitte:', data.abschnitte?.length || 0);
    }
    console.log('═══════════════════════════════');

    return data as WebhookResponse;
  } catch (error) {
    console.error('╔═══════════════════════════════════════════════╗');
    console.error('║  ❌ FEHLER: fetchRegalDataFromMake            ║');
    console.error('╚═══════════════════════════════════════════════╝');
    console.error(error);
    throw error;
  }
}
