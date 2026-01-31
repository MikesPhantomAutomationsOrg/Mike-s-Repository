import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { useState } from 'react';
import { PruefMatrixData, RegalAbschnitt, Bewertung } from '../types';

interface PruefMatrixProps {
  data: PruefMatrixData;
}

interface GroupedAbschnitte {
  [halle: string]: {
    [bereich: string]: RegalAbschnitt[];
  };
}

function BewertungBadge({ bewertung }: { bewertung: Bewertung }) {
  const colors = {
    Rot: 'bg-red-100 text-red-800 border-red-300',
    Orange: 'bg-orange-100 text-orange-800 border-orange-300',
    Grün: 'bg-green-100 text-green-800 border-green-300',
    Grau: 'bg-gray-100 text-gray-800 border-gray-300'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold border rounded ${colors[bewertung.typ]}`}>
      {bewertung.typ}
      {bewertung.anzahl !== undefined && <span>({bewertung.anzahl})</span>}
    </span>
  );
}

function StatusIcon({ status }: { status?: string }) {
  switch (status) {
    case 'ok':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'mangel':
      return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    case 'kritisch':
      return <XCircle className="w-4 h-4 text-red-600" />;
    case 'nicht_geprueft':
      return <MinusCircle className="w-4 h-4 text-gray-400" />;
    default:
      return <MinusCircle className="w-4 h-4 text-gray-300" />;
  }
}

export function PruefMatrix({ data }: PruefMatrixProps) {
  const [expandedHallen, setExpandedHallen] = useState<Set<string>>(new Set());
  const [expandedBereiche, setExpandedBereiche] = useState<Set<string>>(new Set());

  const groupedData: GroupedAbschnitte = data.abschnitte.reduce((acc, abschnitt) => {
    if (!acc[abschnitt.halle]) {
      acc[abschnitt.halle] = {};
    }
    if (!acc[abschnitt.halle][abschnitt.bereich]) {
      acc[abschnitt.halle][abschnitt.bereich] = [];
    }
    acc[abschnitt.halle][abschnitt.bereich].push(abschnitt);
    return acc;
  }, {} as GroupedAbschnitte);

  const toggleHalle = (halle: string) => {
    const newExpanded = new Set(expandedHallen);
    if (newExpanded.has(halle)) {
      newExpanded.delete(halle);
    } else {
      newExpanded.add(halle);
    }
    setExpandedHallen(newExpanded);
  };

  const toggleBereich = (key: string) => {
    const newExpanded = new Set(expandedBereiche);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedBereiche(newExpanded);
  };

  return (
    <div className="max-w-full mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-6 py-5">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {data.title}
          </h2>
          <p className="text-gray-700">
            {data.description}
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="p-6">
            {Object.entries(groupedData).map(([halle, bereiche]) => {
              const isHalleExpanded = expandedHallen.has(halle);

              return (
                <div key={halle} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleHalle(halle)}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
                  >
                    {isHalleExpanded ? (
                      <ChevronDown className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    )}
                    <span className="font-bold text-lg text-gray-900">{halle}</span>
                    <span className="ml-auto text-sm text-gray-600">
                      {Object.values(bereiche).flat().length} Abschnitt{Object.values(bereiche).flat().length !== 1 ? 'e' : ''}
                    </span>
                  </button>

                  {isHalleExpanded && (
                    <div className="bg-white">
                      {Object.entries(bereiche).map(([bereich, abschnitte]) => {
                        const bereichKey = `${halle}-${bereich}`;
                        const isBereichExpanded = expandedBereiche.has(bereichKey);

                        return (
                          <div key={bereichKey} className="border-t border-gray-200">
                            <button
                              onClick={() => toggleBereich(bereichKey)}
                              className="w-full flex items-center gap-2 px-6 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                            >
                              {isBereichExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                              )}
                              <span className="font-semibold text-gray-900">{bereich}</span>
                              <span className="ml-auto text-sm text-gray-600">
                                {abschnitte.length} Abschnitt{abschnitte.length !== 1 ? 'e' : ''}
                              </span>
                            </button>

                            {isBereichExpanded && (
                              <div className="divide-y divide-gray-100">
                                {abschnitte.map((abschnitt) => (
                                  <div key={abschnitt.id} className="px-8 py-4 hover:bg-gray-50">
                                    <div className="mb-4">
                                      <h4 className="font-semibold text-gray-900 mb-1">
                                        {abschnitt.regal} - {abschnitt.abschnitt}
                                      </h4>
                                    </div>

                                    {abschnitt.objekte && abschnitt.objekte.length > 0 && (
                                      <div className="mb-4">
                                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Objekte</h5>
                                        <div className="space-y-3">
                                          {abschnitt.objekte.map((objekt, idx) => (
                                            <div key={idx} className="pl-4 border-l-2 border-blue-200">
                                              <div className="font-medium text-sm text-gray-900 mb-1">
                                                {objekt.name}
                                              </div>
                                              {objekt.bewertungen && objekt.bewertungen.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                  {objekt.bewertungen.map((bewertung, bIdx) => (
                                                    <BewertungBadge key={bIdx} bewertung={bewertung} />
                                                  ))}
                                                </div>
                                              )}
                                              {objekt.pruefpunkte && objekt.pruefpunkte.length > 0 && (
                                                <div className="space-y-1 mt-2">
                                                  {objekt.pruefpunkte.map((punkt, pIdx) => (
                                                    <div key={pIdx} className="flex items-start gap-2 text-xs">
                                                      <StatusIcon status={punkt.status} />
                                                      <span className="text-gray-700">{punkt.name}</span>
                                                      {punkt.bemerkung && (
                                                        <span className="text-gray-500 italic">- {punkt.bemerkung}</span>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {abschnitt.pruefpunkte && abschnitt.pruefpunkte.length > 0 && (
                                      <div className="mb-4">
                                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Prüfpunkte</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                          {abschnitt.pruefpunkte.map((punkt, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-xs bg-gray-50 px-3 py-2 rounded">
                                              <StatusIcon status={punkt.status} />
                                              <div className="flex-1">
                                                <div className="font-medium text-gray-900">{punkt.name}</div>
                                                {punkt.bemerkung && (
                                                  <div className="text-gray-600 mt-0.5">{punkt.bemerkung}</div>
                                                )}
                                                {punkt.bewertung && (
                                                  <div className="mt-1">
                                                    <BewertungBadge bewertung={punkt.bewertung} />
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {abschnitt.infos && Object.keys(abschnitt.infos).length > 0 && (
                                      <div className="mb-2">
                                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Regal-Informationen</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                                          {Object.entries(abschnitt.infos).map(([key, value]) => (
                                            <div key={key} className="flex gap-2">
                                              <span className="font-medium text-gray-600">{key}:</span>
                                              <span className="text-gray-900">{String(value ?? '-')}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
