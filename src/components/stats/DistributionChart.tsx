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
  // Transformar datos para Recharts
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => ({
    score: score.toString(),
    [user1Label]: user1Distribution[score as keyof ScoreDistribution] || 0,
    [user2Label]: user2Distribution[score as keyof ScoreDistribution] || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="score" 
          label={{ value: 'Puntuación', position: 'insideBottom', offset: -5 }}
          className="text-xs"
        />
        <YAxis 
          label={{ value: 'Cantidad', angle: -90, position: 'insideLeft' }}
          className="text-xs"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          }}
          labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
        />
        <Legend />
        <Bar dataKey={user1Label} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Bar dataKey={user2Label} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}