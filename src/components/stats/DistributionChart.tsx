'use client';

import { ScoreDistribution } from '@/types/stats';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DistributionChartProps {
  user1Distribution: ScoreDistribution;
  user2Distribution: ScoreDistribution;
  user1Label?: string;
  user2Label?: string;
}

export function DistributionChart({
  user1Distribution,
  user2Distribution,
  user1Label = 'Usuario 1',
  user2Label = 'Usuario 2',
}: DistributionChartProps) {
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => ({
    score: score.toString(),
    [user1Label]: user1Distribution[score as keyof ScoreDistribution] || 0,
    [user2Label]: user2Distribution[score as keyof ScoreDistribution] || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      {/* Añadimos un margen inferior extra para que la etiqueta "Puntuación" no se corte */}
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
        
        <XAxis 
          dataKey="score" 
          className="text-xs"
          tickLine={false}
          axisLine={false}
          label={{ 
            value: 'Puntuación', 
            position: 'bottom', // Cambiado a 'bottom' para que baje más
            offset: 10,        // Distancia hacia abajo desde el eje
            className: "text-xs font-medium fill-muted-foreground" 
          }}
        />
        
        <YAxis 
          className="text-xs"
          tickLine={false}
          axisLine={false}
          allowDecimals={false} // <--- Fuerza números naturales (0, 1, 2...)
          label={{ 
            value: 'Cantidad', 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle' } 
          }}
        />

        {/* He eliminado el Tooltip para que no salgan datos al pasar el ratón */}
        
        <Legend verticalAlign="top" height={36}/>
        
        <Bar 
          dataKey={user1Label} 
          fill="#db6468" 
          radius={[4, 4, 0, 0]} 
          barSize={20}
        />
        
        <Bar 
          dataKey={user2Label} 
          fill="#d67ea9" 
          radius={[4, 4, 0, 0]} 
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}