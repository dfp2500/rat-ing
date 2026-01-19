'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { NameType, ValueType, Formatter } from 'recharts/types/component/DefaultTooltipContent';

interface EvolutionData {
  month: string;
  average: number;
  count: number;
}

interface EvolutionChartProps {
  data: EvolutionData[];
  label?: string;
  color?: string;
}

export function EvolutionChart({ 
  data, 
  label = 'Promedio',
  color = '#db6468'
}: EvolutionChartProps) {
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No hay suficientes datos para mostrar la evolución
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    monthLabel: formatMonth(item.month),
    average: Number(item.average) 
  }));

  const tooltipFormatter: Formatter<ValueType, NameType> = (value, name) => {
    const numValue = Number(value || 0);
    const nameStr = String(name || '');
    
    if (nameStr === label || nameStr === 'average') {
      return [numValue.toFixed(2), 'Promedio'];
    }
    return [numValue, nameStr];
  };

  return (
    <div className="w-full h-[300px] select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="monthLabel"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 10]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
            }}
            formatter={tooltipFormatter}
          />
          <Legend verticalAlign="top" height={36}/>
          <Line 
            type="monotone" 
            dataKey="average" 
            stroke={color} 
            strokeWidth={3}
            dot={{ r: 4, fill: color, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            name={label}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatMonth(monthStr: string): string {
  if (!monthStr || typeof monthStr !== 'string' || !monthStr.includes('-')) {
    return 'N/A';
  }
  
  const parts = monthStr.split('-');
  const year = parts[0];
  const month = parts[1];
  
  if (!month) return monthStr;

  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthIdx = parseInt(month) - 1;
  
  if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return monthStr;
  
  return `${monthNames[monthIdx]} ${year}`;
}