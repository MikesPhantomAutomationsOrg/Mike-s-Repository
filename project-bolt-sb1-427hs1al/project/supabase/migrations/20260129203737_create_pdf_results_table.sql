/*
  # Create pdf_results table
  
  ## Overview
  Diese Tabelle speichert die Verarbeitungsergebnisse von Make.com nach PDF-Parsing.
  
  ## 1. Neue Tabelle
  
  ### `pdf_results`
  Speichert JSON-Ergebnisse der PDF-Verarbeitung
  - `id` (uuid, primary key) - Job-ID (entspricht der Job-ID vom Upload)
  - `status` (text) - Verarbeitungsstatus: 'processing', 'done', 'error'
  - `result` (jsonb, nullable) - Vollständiges JSON-Resultat von Make.com
  - `error` (text, nullable) - Fehlermeldung bei Fehler
  - `created_at` (timestamptz) - Erstellungszeitpunkt
  - `updated_at` (timestamptz) - Letztes Update
  
  ## 2. Security (RLS)
  
  - RLS ist aktiviert
  - Authentifizierte User können alle Ergebnisse lesen (Polling)
  - Service Role (Make.com) kann Ergebnisse einfügen und aktualisieren
  - Anon-User können Ergebnisse lesen (für Public-Webhooks)
  
  ## 3. Indexes
  
  - Index auf status für schnelles Polling
  - Index auf created_at für zeitbasierte Queries
  
  ## Important Notes
  
  1. Die id ist die Job-ID vom Upload, nicht auto-generiert
  2. Make.com schreibt hier nach der Verarbeitung
  3. Frontend pollt diese Tabelle bis status = 'done'
*/

-- Create pdf_results table
CREATE TABLE IF NOT EXISTS pdf_results (
  id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'processing',
  result jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('processing', 'done', 'error'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pdf_results_status ON pdf_results(status);
CREATE INDEX IF NOT EXISTS idx_pdf_results_created_at ON pdf_results(created_at DESC);

-- Enable RLS
ALTER TABLE pdf_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pdf_results

-- Authenticated users can read all results (for polling)
CREATE POLICY "Authenticated users can read pdf results"
  ON pdf_results
  FOR SELECT
  TO authenticated
  USING (true);

-- Anon users can read all results (for public access)
CREATE POLICY "Anon users can read pdf results"
  ON pdf_results
  FOR SELECT
  TO anon
  USING (true);

-- Service role (Make.com) can insert results
CREATE POLICY "Service role can insert pdf results"
  ON pdf_results
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Service role (Make.com) can update results
CREATE POLICY "Service role can update pdf results"
  ON pdf_results
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anon users can insert results (for webhook access)
CREATE POLICY "Anon users can insert pdf results"
  ON pdf_results
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Anon users can update results (for webhook access)
CREATE POLICY "Anon users can update pdf results"
  ON pdf_results
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
