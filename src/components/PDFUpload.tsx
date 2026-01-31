import { Upload } from 'lucide-react';
import { useState } from 'react';

interface PDFUploadProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

export function PDFUpload({ onFileSelected, isLoading }: PDFUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        onFileSelected(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className="relative"
      >
        <input
          type="file"
          id="pdf-upload"
          accept=".pdf"
          onChange={handleChange}
          disabled={isLoading}
          className="hidden"
        />
        <label
          htmlFor="pdf-upload"
          className={`
            flex flex-col items-center justify-center w-full h-64
            border-2 border-dashed rounded-lg cursor-pointer
            transition-all duration-200
            ${dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className={`w-12 h-12 mb-4 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className="mb-2 text-sm text-gray-700">
              <span className="font-semibold">Klicken Sie zum Hochladen</span> oder ziehen Sie die Datei hierher
            </p>
            <p className="text-xs text-gray-500">PDF-Prüfbericht</p>
          </div>
        </label>
      </form>
    </div>
  );
}
