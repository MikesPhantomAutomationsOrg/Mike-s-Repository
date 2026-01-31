export interface Issue {
  component: string;
  color: 'Rot' | 'Orange' | 'Grün';
  count: number;
}

export interface Regal {
  label: string;
  code: string | null;
  issues: Issue[];
}

export interface ParsedReport {
  sourceFile: string;
  regale: Regal[];
}

export interface SelectionItem {
  id: string;
  label: string;
}

export interface DynamicSelectionData {
  title: string;
  description: string;
  items: SelectionItem[];
}

export interface RegalResponse {
  view: string;
  title: string;
  description: string;
  items: SelectionItem[];
}

export interface Bewertung {
  typ: 'Rot' | 'Orange' | 'Grün' | 'Grau';
  anzahl?: number;
}

export interface Pruefpunkt {
  name: string;
  status?: 'ok' | 'mangel' | 'kritisch' | 'nicht_geprueft';
  bewertung?: Bewertung;
  bemerkung?: string;
}

export interface RegalObjekt {
  name: string;
  bewertungen: Bewertung[];
  pruefpunkte: Pruefpunkt[];
}

export interface RegalInfo {
  [key: string]: string | number | boolean | null;
}

export interface RegalAbschnitt {
  id: string;
  halle: string;
  bereich: string;
  regal: string;
  abschnitt: string;
  objekte: RegalObjekt[];
  pruefpunkte: Pruefpunkt[];
  infos: RegalInfo;
}

export interface PruefMatrixData {
  view: 'pruef-matrix';
  title: string;
  description: string;
  schema: {
    objekte: string[];
    bewertungen: string[];
    pruefpunkte: string[];
    infoFelder: string[];
  };
  abschnitte: RegalAbschnitt[];
}

export type WebhookResponse = RegalResponse | PruefMatrixData;
