import { CheckSquare, Square } from 'lucide-react';
import { RegalResponse } from '../types';

interface RegalAuswahlProps {
  data: RegalResponse;
  selectedItems: Set<string>;
  onToggleItem: (id: string) => void;
  onToggleAll: () => void;
}

export function RegalAuswahl({
  data,
  selectedItems,
  onToggleItem,
  onToggleAll
}: RegalAuswahlProps) {
  const allSelected = selectedItems.size === data.items.length && data.items.length > 0;
  const someSelected = selectedItems.size > 0 && selectedItems.size < data.items.length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-6 py-5">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {data.title}
          </h2>
          <p className="text-gray-700">
            {data.description}
          </p>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <button
              onClick={onToggleAll}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              {allSelected ? (
                <>
                  <CheckSquare className="w-4 h-4" />
                  Alle abwählen
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  Alle auswählen
                </>
              )}
            </button>
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{selectedItems.size}</span>
              {' '}von{' '}
              <span className="font-semibold text-gray-900">{data.items.length}</span>
              {' '}ausgewählt
            </div>
          </div>

          <div className="space-y-2">
            {data.items.map((item) => {
              const isSelected = selectedItems.has(item.id);

              return (
                <label
                  key={item.id}
                  className={`
                    flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer
                    transition-all duration-200
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleItem(item.id)}
                    className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                  />
                  <span className={`flex-1 font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                  {isSelected && (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  )}
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
