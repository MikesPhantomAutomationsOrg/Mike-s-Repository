import { supabase } from '../supabase/supabase';
import { WebhookResponse } from '../types';

const POLL_INTERVAL_MS = 2000;    // 2 Sekunden
const TIMEOUT_MS = 5 * 60 * 1000; // 5 Minuten

export interface PdfPollResult {
  status: 'pending' | 'processing' | 'done' | 'error';
  result?: WebhookResponse;
  error?: string;
}

export async function pollPdfResult(jobId: string): Promise<PdfPollResult> {
  const start = Date.now();

  console.log(`Starte Polling für Job-ID: ${jobId}`);

  while (Date.now() - start < TIMEOUT_MS) {
    const { data, error } = await supabase
      .from('pdf_results')
      .select('status, result, error')
      .eq('id', jobId)
      .maybeSingle();

    if (error) {
      console.error('Polling error:', error);
      throw new Error(`Fehler beim Abrufen der Ergebnisse: ${error.message}`);
    }

    if (!data) {
      console.log('Noch kein Eintrag, warte...');
      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    console.log(`Status: ${data.status}`);

    if (data.status === 'done') {
      console.log('✓ Verarbeitung abgeschlossen');
      return {
        status: 'done',
        result: data.result,
      };
    }

    if (data.status === 'error') {
      console.error('✗ Verarbeitung fehlgeschlagen:', data.error);
      return {
        status: 'error',
        error: data.error || 'Unbekannter Fehler',
      };
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error('Timeout: PDF-Verarbeitung hat länger als 5 Minuten gedauert.');
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}