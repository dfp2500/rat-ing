'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { NameType, ValueType, Formatter } from 'recharts/types/component/DefaultTooltipContent';

interface AgreementChartProps {
  perfectAgreement: number;
  closeAgreement: number;
  moderateAgreement: number;
  disagreement: number;
}

const COLORS = {
  perfect: 'hsl(142, 76%, 36%)',
  close: 'hsl(142, 71%, 45%)',
  moderate: 'hsl(43, 96%, 56%)',
  disagreement: 'hsl(0, 84%, 60%)',
};

export function AgreementChart({
  perfectAgreement,
  closeAgreement,
  moderateAgreement,
  disagreement,
}: AgreementChartProps) {
  const data = [
    { name: 'Totalmente de acuerdo', value: perfectAgreement, color: COLORS.perfect },
    { name: 'Muy de acuerdo (±1)', value: closeAgreement, color: COLORS.close },
    { name: 'Algo de desacuerdo (±2)', value: moderateAgreement, color: COLORS.moderate },
    { name: 'Desacuerdo (>2)', value: disagreement, color: COLORS.disagreement },
  ].filter((item) => item.value > 0);

  const tooltipFormatter: Formatter<ValueType, NameType> = (value, name) => {
    return [value, String(name)];
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No hay datos suficientes para mostrar
      </div>
    );
  }

  return (
    <div className="select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => 
              percent !== undefined 
                ? `${(percent * 100).toFixed(0)}%` 
                : name
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              padding: '8px',
            }}
            itemStyle={{ color: '#374151' }}
            formatter={tooltipFormatter}
          />
          
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
