/*
  # Storage SELECT Policy für PDF-Uploads

  1. Änderungen
    - Fügt SELECT-Policy für den Storage Bucket "pdf-uploads" hinzu
    - Erlaubt öffentliches Lesen von PDF-Dateien
    - Notwendig für die Erstellung von Signed URLs
    
  2. Sicherheit
    - Policy gilt nur für den Bucket "pdf-uploads"
    - Öffentlicher Lesezugriff aktiviert (für Signed URL Generierung)
    
  3. Wichtige Hinweise
    - Ohne SELECT-Policy schlägt createSignedUrl mit "Object not found" fehl
    - Diese Policy ermöglicht es, Signed URLs für hochgeladene PDFs zu erstellen
*/

-- Prüfen ob Policy bereits existiert, wenn nicht, dann erstellen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public PDF reading'
  ) THEN
    CREATE POLICY "Allow public PDF reading"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'pdf-uploads');
  END IF;
END $$;
