import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { GlobalInsights, PermittedTopic } from '../../types';

interface AnalyticsChartsProps {
  insights: GlobalInsights | null;
}

const SENTIMENT_COLORS = {
  positive: '#10b981', // emerald-500
  neutral: '#f59e0b',  // amber-500
  negative: '#f43f5e', // rose-500
};

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ insights }) => {
  if (!insights || insights.totalAnalyzed === 0) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-xl p-8 text-center text-slate-400 mb-6">
        No analytics data available. Upload reviews to visualize sentiment and topic distributions.
      </div>
    );
  }

  // 1. Sentiment Donut Data
  const sentimentData = [
    { name: 'Positive', value: insights.sentimentPercentages.positive, color: SENTIMENT_COLORS.positive },
    { name: 'Neutral', value: insights.sentimentPercentages.neutral, color: SENTIMENT_COLORS.neutral },
    { name: 'Negative', value: insights.sentimentPercentages.negative, color: SENTIMENT_COLORS.negative },
  ];

  // 2. Topic Distribution Data
  const topicData = Object.entries(insights.topicCounts)
    .map(([topic, count]) => ({
      name: topic.charAt(0).toUpperCase() + topic.slice(1).replace('_', ' '),
      count,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  // 3. Product-wise Sentiment Stacked Data
  const productData = insights.productInsights.map((p) => ({
    name: p.product.length > 18 ? p.product.slice(0, 16) + '...' : p.product,
    fullName: p.product,
    Positive: p.sentimentBreakdown.positive,
    Neutral: p.sentimentBreakdown.neutral,
    Negative: p.sentimentBreakdown.negative,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Sentiment Donut Chart */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Sentiment Distribution</h3>
          <p className="text-xs text-slate-500 mt-0.5">Overall customer emotion across catalog</p>
        </div>

        <div className="h-64 my-2 flex items-center justify-center">
          <PieChart width={320} height={240}>
            <Pie
              isAnimationActive={false}
              data={sentimentData}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {sentimentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [`${value}%`, 'Percentage']}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '0.5rem',
                fontSize: '12px',
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
          </PieChart>
        </div>
      </div>

      {/* Topics Breakdown Chart */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Topic Distribution</h3>
          <p className="text-xs text-slate-500 mt-0.5">Key topics extracted by AI</p>
        </div>

        <div className="h-64 my-2 flex items-center justify-center">
          <BarChart width={320} height={240} data={topicData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(val: any) => [val, 'Mentions']}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '0.5rem',
                fontSize: '12px',
              }}
            />
            <Bar isAnimationActive={false} dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </div>
      </div>

      {/* Product-wise Sentiment Comparison */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Product Sentiment Breakdown</h3>
          <p className="text-xs text-slate-500 mt-0.5">Sentiment split per product line</p>
        </div>

        <div className="h-64 my-2 flex items-center justify-center">
          <BarChart width={320} height={240} data={productData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '0.5rem',
                fontSize: '12px',
              }}
            />
            <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            <Bar isAnimationActive={false} dataKey="Positive" stackId="a" fill={SENTIMENT_COLORS.positive} />
            <Bar isAnimationActive={false} dataKey="Neutral" stackId="a" fill={SENTIMENT_COLORS.neutral} />
            <Bar isAnimationActive={false} dataKey="Negative" stackId="a" fill={SENTIMENT_COLORS.negative} radius={[4, 4, 0, 0]} />
          </BarChart>
        </div>
      </div>
    </div>
  );
};
