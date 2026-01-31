import { DynamicSelectionData } from '../types';

interface DynamicSelectionViewProps {
  data: DynamicSelectionData;
  selectedItems: Set<string>;
  onToggleItem: (id: string) => void;
  onToggleAll: () => void;
}

export function DynamicSelectionView({
  data,
  selectedItems,
  onToggleItem,
  onToggleAll
}: DynamicSelectionViewProps) {
  const allSelected = data.items.length > 0 && selectedItems.size === data.items.length;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {data.title}
        </h2>
        <p className="text-gray-600">
          {data.description}
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {data.items.length} Element{data.items.length !== 1 ? 'e' : ''} verfügbar
        </span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleAll}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Alle auswählen</span>
        </label>
      </div>

      <div className="space-y-3">
        {data.items.map((item) => {
          const isSelected = selectedItems.has(item.id);

          return (
            <div
              key={item.id}
              className={`
                border rounded-lg p-4 transition-all duration-200
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleItem(item.id)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-900 font-medium">
                  {item.label}
                </span>
              </label>
            </div>
          );
        })}
      </div>

      {data.items.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            Keine Elemente verfügbar
          </p>
        </div>
      )}
    </div>
  );
}
