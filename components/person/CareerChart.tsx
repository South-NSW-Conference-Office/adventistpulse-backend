'use client'

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'

interface YearStat {
  year: number
  membership: number
  baptisms: number
  net_gain: number
}

interface Props {
  data: YearStat[]
  startYear: number
}

export default function CareerChart({ data, startYear }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,127,149,0.1)" />
        <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#7C7F95' }} />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: '#7C7F95', fontFamily: 'monospace' }}
          domain={['auto', 'auto']}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fill: '#7C7F95', fontFamily: 'monospace' }}
          domain={[0, 'auto']}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, background: '#1f2b3d', border: '1px solid rgba(255,255,255,0.1)' }}
          labelStyle={{ color: '#e0e7ff', fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
        <ReferenceLine
          yAxisId="left"
          x={startYear}
          stroke="#14b8a6"
          strokeDasharray="4 3"
          label={{ value: 'Tenure begins', fontSize: 10, fill: '#818cf8', position: 'top' }}
        />
        <Bar yAxisId="right" dataKey="baptisms" name="Baptisms" fill="#00D4AA" opacity={0.7} radius={[3,3,0,0]} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="membership"
          name="Membership"
          stroke="#14b8a6"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#14b8a6' }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
