'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AgreementChartProps {
  perfectAgreement: number;
  closeAgreement: number;
  moderateAgreement: number;
  disagreement: number;
}

const COLORS = {
  perfect: 'hsl(142, 76%, 36%)', // green-600
  close: 'hsl(142, 71%, 45%)', // green-500
  moderate: 'hsl(43, 96%, 56%)', // amber-500
  disagreement: 'hsl(0, 84%, 60%)', // red-500
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

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No hay datos suficientes para mostrar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            // Añadimos una validación para asegurar que percent sea un número
            label={({ name, percent }) => 
                percent !== undefined 
                ? `${name}: ${(percent * 100).toFixed(0)}%` 
                : name
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            >
            {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}