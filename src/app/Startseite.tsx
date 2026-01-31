import { supabase } from '../supabase/supabase';
import { WebhookResponse } from '../types';

const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS = 5 * 60 * 1000;

export interface PdfPollResult {
  status: 'pending' | 'processing' | 'done' | 'error';
  result?: WebhookResponse;
  error?: string;
}

function deepParseResult(raw: any): WebhookResponse {
  // 1️⃣ already object
  if (typeof raw === 'object') return raw;

  // 2️⃣ string → parse
  if (typeof raw === 'string') {
    const first = JSON.parse(raw);

    // 3️⃣ still string? parse again
    if (typeof first === 'string') {
      return JSON.parse(first);
    }

    return first;
  }

  throw new Error('Unbekanntes Result-Format');
}

export async function pollPdfResult(jobId: string): Promise<PdfPollResult> {
  const start = Date.now();
  console.log('🔁 Polling gestartet für:', jobId);

  while (Date.now() - start < TIMEOUT_MS) {
    const { data, error } = await supabase
      .from('pdf_results')
      .select('status, result, error')
      .eq('id', jobId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    console.log('📄 DB Status:', data.status);

    if (data.status === 'done') {
      try {
        const parsed = deepParseResult(data.result);

        console.log('✅ JSON erfolgreich geparst');
        return {
          status: 'done',
          result: parsed,
        };
      } catch (e) {
        console.error('❌ JSON Parse Fehler:', data.result);
        throw new Error('Result ist kein gültiges JSON');
      }
    }

    if (data.status === 'error') {
      return {
        status: 'error',
        error: data.error || 'Unbekannter Fehler',
      };
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error('⏱️ Timeout: Verarbeitung > 5 Minuten');
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}