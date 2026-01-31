import { useState } from 'react';
import { PDFUpload } from '../components/PDFUpload';
import { DynamicSelectionView } from '../components/DynamicSelectionView';
import { pollPdfResult } from '../utils/pollPdfResult';
import { uploadPDFToStorage } from '../utils/uploadPDF';
import { DynamicSelectionData } from '../types';

export default function Startseite() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfResult, setPdfResult] = useState<DynamicSelectionData | null>(null);
  const [showDynamicView, setShowDynamicView] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleFileSelected = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const { jobId } = await uploadPDFToStorage(file);
      console.log('📤 Datei hochgeladen, jobId:', jobId);

      const result = await pollPdfResult(jobId);

      if (result.status === 'done' && result.result) {
        setPdfResult(result.result);
        setShowDynamicView(true);
      } else if (result.status === 'error') {
        setError(result.error || 'PDF-Verarbeitung fehlgeschlagen');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      console.error('❌ Fehler:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleToggleAll = () => {
    if (pdfResult) {
      if (selectedItems.size === pdfResult.items.length) {
        setSelectedItems(new Set());
      } else {
        setSelectedItems(new Set(pdfResult.items.map(item => item.id)));
      }
    }
  };

  if (showDynamicView && pdfResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="mb-6">
          <button
            onClick={() => {
              setShowDynamicView(false);
              setPdfResult(null);
              setSelectedItems(new Set());
            }}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Zurück
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <DynamicSelectionView
            data={pdfResult}
            selectedItems={selectedItems}
            onToggleItem={handleToggleItem}
            onToggleAll={handleToggleAll}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Regalprüfung
            </h1>
            <p className="text-gray-600">
              Laden Sie einen PDF-Prüfbericht hoch, um die Verarbeitung zu starten
            </p>
          </div>

          <PDFUpload onFileSelected={handleFileSelected} isLoading={isLoading} />

          {isLoading && (
            <div className="mt-6 flex justify-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-gray-600">Verarbeitung läuft...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-semibold">Fehler</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
