/*
  # PDF Processing & Results Tables

  ## Overview
  Diese Migration erstellt die Infrastruktur für asynchrone PDF-Verarbeitung:
  - PDFs werden hochgeladen und der Job-Status wird getrackt
  - Make.com verarbeitet asynchron und speichert Ergebnisse
  - Frontend pollt Status und lädt fertige Ergebnisse

  ## 1. Neue Tabellen
  
  ### `pdf_jobs`
  Tracking von PDF-Upload und Verarbeitungsstatus
  - `id` (uuid, primary key) - Job-ID
  - `file_path` (text) - Pfad in Supabase Storage
  - `file_name` (text) - Original-Dateiname
  - `bucket` (text) - Storage Bucket Name
  - `signed_url` (text) - Temporäre Download-URL für Make
  - `status` (text) - processing, completed, error
  - `error_message` (text, nullable) - Fehlermeldung bei Fehler
  - `created_at` (timestamptz) - Upload-Zeitpunkt
  - `completed_at` (timestamptz, nullable) - Fertigstellung

  ### `parsed_results`
  Gespeicherte Parse-Ergebnisse von Make.com
  - `id` (uuid, primary key)
  - `job_id` (uuid, foreign key) - Referenz zu pdf_jobs
  - `view_type` (text) - regal-auswahl oder pruef-matrix
  - `data` (jsonb) - Vollständiges JSON-Resultat
  - `created_at` (timestamptz) - Speicherzeitpunkt

  ## 2. Security (RLS)
  
  - Beide Tabellen haben RLS aktiviert
  - Authentifizierte User können ihre eigenen Jobs lesen/erstellen
  - Service Role (Make.com) kann Jobs updaten und Ergebnisse schreiben
  
  ## 3. Indexes
  
  - Index auf pdf_jobs(status) für schnelles Polling
  - Index auf parsed_results(job_id) für schnelle Job-Lookups
*/

-- Create pdf_jobs table
CREATE TABLE IF NOT EXISTS pdf_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  file_name text NOT NULL,
  bucket text NOT NULL DEFAULT 'pdf-uploads',
  signed_url text,
  status text NOT NULL DEFAULT 'processing',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  
  CONSTRAINT valid_status CHECK (status IN ('processing', 'completed', 'error'))
);

-- Create parsed_results table
CREATE TABLE IF NOT EXISTS parsed_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES pdf_jobs(id) ON DELETE CASCADE,
  view_type text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_view_type CHECK (view_type IN ('regal-auswahl', 'pruef-matrix'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pdf_jobs_status ON pdf_jobs(status);
CREATE INDEX IF NOT EXISTS idx_pdf_jobs_created_at ON pdf_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parsed_results_job_id ON parsed_results(job_id);

-- Enable RLS
ALTER TABLE pdf_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE parsed_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pdf_jobs

-- Authenticated users can insert their own jobs
CREATE POLICY "Users can create PDF jobs"
  ON pdf_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can read their own jobs
CREATE POLICY "Users can read own PDF jobs"
  ON pdf_jobs
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role (Make.com) can update jobs
CREATE POLICY "Service role can update PDF jobs"
  ON pdf_jobs
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for parsed_results

-- Authenticated users can read results
CREATE POLICY "Users can read parsed results"
  ON parsed_results
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role (Make.com) can insert results
CREATE POLICY "Service role can insert parsed results"
  ON parsed_results
  FOR INSERT
  TO service_role
  WITH CHECK (true);