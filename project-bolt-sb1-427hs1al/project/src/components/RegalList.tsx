import { Regal } from '../types';

interface RegalListProps {
  regale: Regal[];
  selectedRegale: Set<number>;
  onToggleRegal: (index: number) => void;
  onToggleAll: () => void;
}

export function RegalList({ regale, selectedRegale, onToggleRegal, onToggleAll }: RegalListProps) {
  const allSelected = regale.length > 0 && selectedRegale.size === regale.length;

  const getColorBadge = (color: string) => {
    const colorClasses = {
      'Rot': 'bg-red-100 text-red-800 border-red-200',
      'Orange': 'bg-orange-100 text-orange-800 border-orange-200',
      'Grün': 'bg-green-100 text-green-800 border-green-200'
    };
    return colorClasses[color as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getSummary = (regal: Regal) => {
    const summary: { [key: string]: { [color: string]: number } } = {};

    regal.issues.forEach(issue => {
      if (!summary[issue.component]) {
        summary[issue.component] = {};
      }
      summary[issue.component][issue.color] = (summary[issue.component][issue.color] || 0) + issue.count;
    });

    return Object.entries(summary).map(([component, colors]) =>
      Object.entries(colors).map(([color, count]) => ({
        component,
        color,
        count
      }))
    ).flat();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Gefundene Regale ({regale.length})
        </h2>
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

      <div className="space-y-4">
        {regale.map((regal, index) => {
          const isSelected = selectedRegale.has(index);
          const summary = getSummary(regal);

          return (
            <div
              key={index}
              className={`
                border rounded-lg p-5 transition-all duration-200
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleRegal(index)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {regal.label}
                    </h3>
                    {regal.code && (
                      <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {regal.code}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {summary.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-700 font-medium min-w-[180px]">
                          {item.component}:
                        </span>
                        <span
                          className={`px-2 py-1 rounded border font-medium ${getColorBadge(item.color)}`}
                        >
                          {item.count} × {item.color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
