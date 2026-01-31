/*
  # Storage Policy für PDF-Uploads

  1. Änderungen
    - Erstellt INSERT-Policy für den Storage Bucket "pdf-uploads"
    - Erlaubt öffentlichen Upload von PDF-Dateien
    
  2. Sicherheit
    - Policy gilt nur für den Bucket "pdf-uploads"
    - Verwendet WITH CHECK für INSERT-Operationen
    - Öffentlicher Zugriff für Uploads aktiviert
*/

CREATE POLICY "Allow public PDF uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'pdf-uploads');
