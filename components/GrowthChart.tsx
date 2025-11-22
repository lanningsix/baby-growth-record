import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TimelineEvent, RecordType } from '../types';
import { useTranslation } from '../i18n';
import { TrendingUp } from 'lucide-react';

interface Props {
  events: TimelineEvent[];
}

const GrowthChart: React.FC<Props> = ({ events }) => {
  const { t, locale } = useTranslation();

  // Filter and transform data
  const data = events
    .filter(e => e.type === RecordType.GROWTH && e.growthData)
    .map(e => ({
      date: new Date(e.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
      fullDate: new Date(e.date).toLocaleDateString(locale),
      height: e.growthData?.height,
      weight: e.growthData?.weight,
      rawDate: new Date(e.date).getTime()
    }))
    .sort((a, b) => a.rawDate - b.rawDate);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-10 text-center shadow-sm border border-slate-50 flex flex-col items-center justify-center h-80">
        <div className="bg-slate-50 p-6 rounded-full mb-6">
            <TrendingUp size={40} className="text-slate-300" strokeWidth={1.5} />
        </div>
        <p className="text-slate-400 font-bold text-lg">{t('growth.no_records')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-50/50">
        <h3 className="text-slate-800 font-extrabold mb-8 flex items-center gap-3 text-lg">
           <span className="w-3 h-8 bg-blue-500 rounded-full shadow-md shadow-blue-200"></span>
           {t('growth.weight_progression')}
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}} 
                axisLine={false} 
                tickLine={false} 
                tickMargin={12}
              />
              <YAxis 
                domain={['auto', 'auto']} 
                tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '16px' }}
                labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px', fontWeight: 'bold' }}
                itemStyle={{ fontWeight: '800', color: '#3b82f6', fontSize: '14px' }}
              />
              <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="#3b82f6" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorWeight)" 
                activeDot={{ r: 6, strokeWidth: 3, stroke: 'white', fill: '#3b82f6' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-50/50">
        <h3 className="text-slate-800 font-extrabold mb-8 flex items-center gap-3 text-lg">
           <span className="w-3 h-8 bg-pink-500 rounded-full shadow-md shadow-pink-200"></span>
           {t('growth.height_progression')}
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}} 
                axisLine={false} 
                tickLine={false}
                tickMargin={12}
              />
              <YAxis 
                domain={['auto', 'auto']} 
                tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                 contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '16px' }}
                 labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px', fontWeight: 'bold' }}
                 itemStyle={{ fontWeight: '800', color: '#ec4899', fontSize: '14px' }}
              />
              <Area 
                type="monotone" 
                dataKey="height" 
                stroke="#ec4899" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorHeight)" 
                activeDot={{ r: 6, strokeWidth: 3, stroke: 'white', fill: '#ec4899' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default GrowthChart;