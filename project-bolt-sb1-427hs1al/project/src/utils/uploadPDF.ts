import { supabase } from '../supabase/supabase';

export interface UploadResult {
  path: string;
  signedUrl: string;
  fileName: string;
  bucket: string;
  jobId: string;
}

export async function uploadPDFToStorage(file: File): Promise<UploadResult> {
  if (file.type !== 'application/pdf') {
    throw new Error('Nur PDF-Dateien sind erlaubt');
  }

  const jobId = crypto.randomUUID();
  const filePath = `pdfs/${jobId}-${file.name}`;

  const { error: uploadError } = await supabase
    .storage
    .from('pdf-uploads')
    .upload(filePath, file, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Supabase Upload fehlgeschlagen: ${uploadError.message}`);
  }

  const { data: signed, error: signedError } =
    await supabase
      .storage
      .from('pdf-uploads')
      .createSignedUrl(filePath, 60 * 60);

  if (signedError || !signed) {
    throw new Error('Signed URL konnte nicht erstellt werden');
  }

  return {
    path: filePath,
    signedUrl: signed.signedUrl,
    fileName: file.name,
    bucket: 'pdf-uploads',
    jobId,
  };
}