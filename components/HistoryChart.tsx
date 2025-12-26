
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MedicationLog } from '../types';

interface HistoryChartProps {
  logs: MedicationLog[];
}

const HistoryChart: React.FC<HistoryChartProps> = ({ logs }) => {
  // 稳定获取本周一的逻辑
  const getMonday = () => {
    const d = new Date();
    const day = d.getDay();
    // 如果是周日(0)，则减去6天回到周一；否则减去 (day - 1)
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const monday = getMonday();

  // 生成从本周一到本周日的 7 天数组
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const data = weekDays.map(date => {
    const count = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate.toDateString() === date.toDateString();
    }).length;

    return {
      name: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
      fullName: date.toLocaleDateString('zh-CN', { weekday: 'long' }),
      count
    };
  });

  return (
    <div className="glass p-6 rounded-3xl mt-8 h-64 w-full max-w-4xl border border-white/50 shadow-sm">
      <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
        本周打卡趋势
      </h3>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} 
          />
          <Tooltip 
            cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            formatter={(value) => [`${value} 次`, '打卡次数']}
            labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => {
              const isToday = new Date().toDateString() === weekDays[index].toDateString();
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={isToday ? '#6366f1' : (entry.count > 0 ? '#a5b4fc' : '#e2e8f0')} 
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoryChart;
