/**
 * Trigger Make.com Webhook für PDF-Verarbeitung
 *
 * Diese Funktion sendet die PDF-Metadaten an Make.com, damit Make die PDF
 * von der signedUrl herunterladen und verarbeiten kann.
 *
 * WICHTIG:
 * - Sendet JSON, NICHT FormData
 * - Make lädt die PDF von der fileUrl (signedUrl) herunter
 * - Make schreibt das Ergebnis in die pdf_results Tabelle
 * - Frontend pollt dann pdf_results für das Ergebnis
 */

export interface MakePdfProcessingPayload {
  jobId: string;
  filePath: string;
  fileUrl: string;
}

export async function triggerMakePdfProcessing(
  payload: MakePdfProcessingPayload
): Promise<void> {
  const webhookUrl = import.meta.env.VITE_MAKE_UPLOAD_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl.trim() === '') {
    throw new Error(
      'Konfigurationsfehler: Die Webhook-URL (VITE_MAKE_UPLOAD_WEBHOOK_URL) ist nicht definiert. ' +
      'Bitte stellen Sie sicher, dass die .env-Datei die korrekte Webhook-URL enthält.'
    );
  }

  if (!webhookUrl.startsWith('https://hook.')) {
    throw new Error(
      'Ungültige Webhook-URL: Die URL muss ein Make.com Custom Webhook sein (beginnt mit "https://hook.").'
    );
  }

  if (!payload.fileUrl || payload.fileUrl.trim() === '') {
    throw new Error(
      'Kritischer Fehler: fileUrl ist leer. Make.com benötigt die signedUrl, um die PDF herunterzuladen.'
    );
  }

  console.log('Triggere Make.com PDF-Verarbeitung...');
  console.log('Job-ID:', payload.jobId);
  console.log('File Path:', payload.filePath);
  console.log('File URL:', payload.fileUrl.substring(0, 50) + '...');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `Make.com Webhook-Fehler: ${response.status} ${response.statusText}`
      );
    }

    console.log('✓ Make.com erfolgreich getriggert');
    console.log('  Make wird jetzt die PDF verarbeiten und das Ergebnis in pdf_results schreiben');
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(
        'Netzwerkfehler beim Triggern von Make.com:\n' +
        '• CORS-Problem: Der Webhook muss als "Custom Webhook" konfiguriert sein\n' +
        '• HTTP-Module unterstützen KEIN CORS und funktionieren nicht vom Browser aus\n' +
        '• Lösung: Verwenden Sie einen Custom Webhook in Make.com (Trigger-Modul)'
      );
    }
    throw error;
  }
}
