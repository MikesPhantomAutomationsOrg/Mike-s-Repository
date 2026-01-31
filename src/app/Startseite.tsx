import { useState } from 'react';
import { PDFUpload } from '../components/PDFUpload';
import { RegalAuswahl } from '../components/RegalAuswahl';
import { PruefMatrix } from '../components/PruefMatrix';
import { uploadPDFToStorage } from '../utils/uploadPDF';
import { triggerMakePdfProcessing } from '../utils/triggerMake';
import { pollPdfResult } from '../utils/pollPdfResult';
import { WebhookResponse, RegalResponse, PruefMatrixData } from '../types';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

type AppState = 'upload' | 'processing' | 'selection' | 'matrix' | 'error';

export default function Startseite() {
  const [state, setState] = useState<AppState>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [webhookData, setWebhookData] = useState<WebhookResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleFileSelected = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setState('processing');
    setStatusMessage('PDF wird hochgeladen...');

    try {
      const uploadResult = await uploadPDFToStorage(file);
      setStatusMessage('PDF hochgeladen. Verarbeitung wird gestartet...');

      await triggerMakePdfProcessing({
        jobId: uploadResult.jobId,
        filePath: uploadResult.path,
        fileUrl: uploadResult.signedUrl,
      });
      setStatusMessage('PDF wird verarbeitet. Bitte warten...');

      const pollResult = await pollPdfResult(uploadResult.jobId);

      if (pollResult.status === 'error') {
        throw new Error(pollResult.error || 'Verarbeitung fehlgeschlagen');
      }

      if (pollResult.status === 'done' && pollResult.result) {
        setWebhookData(pollResult.result);

        if (pollResult.result.view === 'regal-auswahl') {
          setState('selection');
          setStatusMessage('Regalauswahl geladen');
        } else if (pollResult.result.view === 'pruef-matrix') {
          setState('matrix');
          setStatusMessage('Prüfmatrix geladen');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      setState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleItem = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const handleToggleAll = () => {
    if (webhookData && webhookData.view === 'regal-auswahl') {
      const data = webhookData as RegalResponse;
      if (selectedItems.size === data.items.length) {
        setSelectedItems(new Set());
      } else {
        setSelectedItems(new Set(data.items.map(item => item.id)));
      }
    }
  };

  const handleReset = () => {
    setState('upload');
    setSelectedItems(new Set());
    setWebhookData(null);
    setError(null);
    setStatusMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Regalprüfung Datenextraktion
          </h1>
          <p className="text-gray-600">
            PDF hochladen und Prüfdaten automatisch extrahieren
          </p>
        </header>

        <main>
          {state === 'upload' && (
            <PDFUpload onFileSelected={handleFileSelected} isLoading={isLoading} />
          )}

          {state === 'processing' && (
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <h3 className="text-lg font-semibold text-gray-900">
                  PDF wird verarbeitet
                </h3>
                <p className="text-sm text-gray-600 text-center">
                  {statusMessage}
                </p>
              </div>
            </div>
          )}

          {state === 'selection' && webhookData && webhookData.view === 'regal-auswahl' && (
            <div>
              <RegalAuswahl
                data={webhookData as RegalResponse}
                selectedItems={selectedItems}
                onToggleItem={handleToggleItem}
                onToggleAll={handleToggleAll}
              />
              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Neue PDF hochladen
                </button>
              </div>
            </div>
          )}

          {state === 'matrix' && webhookData && webhookData.view === 'pruef-matrix' && (
            <div>
              <PruefMatrix data={webhookData as PruefMatrixData} />
              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Neue PDF hochladen
                </button>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">
                      Fehler bei der Verarbeitung
                    </h3>
                    <p className="text-red-700 whitespace-pre-wrap">
                      {error}
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Erneut versuchen
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
