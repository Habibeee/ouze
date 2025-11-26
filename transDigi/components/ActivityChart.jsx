import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const ActivityChart = ({ data = [] }) => {
  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer>
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            tick={{ fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="devis" 
            stackId="1" 
            stroke="#3b82f6" 
            fill="#93c5fd" 
            name="Devis"
          />
          <Area 
            type="monotone" 
            dataKey="expeditions" 
            stackId="2" 
            stroke="#10b981" 
            fill="#6ee7b7" 
            name="Expéditions"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActivityChart;
