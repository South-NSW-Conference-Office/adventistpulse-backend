'use client';

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { tokens, cn } from '@/lib/theme';
import DataSourceBadge, { type DataSourceMeta } from './DataSourceBadge';

const TEAL = '#00D4AA';
const INDIGO = '#6366F1';
const PURPLE = '#8B5CF6';
const AMBER = '#F59E0B';

// ── Sample badge ──────────────────────────────────────────────────────────────
function SampleBadge() {
  return (
    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase tracking-wide ml-2">
      Sample Data
    </span>
  );
}

// ── Chart header with source badge ───────────────────────────────────────────
function ChartHeader({ title, meta }: { title: string; meta: DataSourceMeta }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-1">
        <h3 className="text-sm font-bold">{title}</h3>
        <SampleBadge />
      </div>
      <DataSourceBadge meta={meta} />
    </div>
  );
}

function FomoNote({ text }: { text: string }) {
  return (
    <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 pt-3 border-t border-amber-100 dark:border-amber-900/30">
      {text}
    </p>
  );
}

// ── 1. Attendance Trend ───────────────────────────────────────────────────────
const attendanceData = [
  { month: 'Feb', attendance: 118 }, { month: 'Mar', attendance: 132 },
  { month: 'Apr', attendance: 124 }, { month: 'May', attendance: 138 },
  { month: 'Jun', attendance: 119 }, { month: 'Jul', attendance: 111 },
  { month: 'Aug', attendance: 129 }, { month: 'Sep', attendance: 145 },
  { month: 'Oct', attendance: 142 }, { month: 'Nov', attendance: 151 },
  { month: 'Dec', attendance: 138 }, { month: 'Jan', attendance: 152 },
];
const avgAttendance = Math.round(attendanceData.reduce((s, d) => s + d.attendance, 0) / attendanceData.length);

export function AttendanceTrendChart({ churchName }: { churchName: string }) {
  return (
    <div>
      <ChartHeader title="Attendance Trend" meta={{
        source: 'Church self-reported',
        type: 'Sample data',
        recency: 'Not yet contributed',
        notes: 'Real attendance data is submitted by church clerks via the Pulse dashboard.'
      }} />
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={attendanceData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,127,149,0.1)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7C7F95' }} />
          <YAxis tick={{ fontSize: 11, fill: '#7C7F95', fontFamily: 'monospace' }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <ReferenceLine y={avgAttendance} stroke={INDIGO} strokeDasharray="6 3" label={{ value: `Avg ${avgAttendance}`, fontSize: 11, fill: INDIGO }} />
          <Line type="monotone" dataKey="attendance" stroke={TEAL} strokeWidth={2.5} dot={{ r: 3, fill: TEAL }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
      <FomoNote text={`${churchName} has not contributed attendance data yet. Complete your profile to unlock real trends.`} />
    </div>
  );
}

// ── 2. Age Demographics ───────────────────────────────────────────────────────
const ageData = [
  { name: 'Children 0-12', value: 23, color: INDIGO },
  { name: 'Youth 13-17',   value: 8,  color: TEAL },
  { name: 'Young Adults',  value: 12, color: AMBER },
  { name: 'Adults 36-60',  value: 31, color: PURPLE },
  { name: 'Seniors 61+',   value: 26, color: '#475569' },
];

export function AgeDemographicsChart({ churchName }: { churchName: string }) {
  return (
    <div>
      <ChartHeader title="Age Demographics" meta={{
        source: 'ABS Census 2021 (community) + Church self-reported (church)',
        type: 'Sample data',
        recency: 'Community: 2021 · Church: Not yet contributed',
        notes: 'Community figures are from the 2021 Australian Bureau of Statistics Census for the church postcode area.'
      }} />
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={ageData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
            {ageData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => String(v) + "%"} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
      <FomoNote text={`${churchName} has not contributed demographic data yet. Your real data could help the conference better serve your community.`} />
    </div>
  );
}

// ── 3. Ministry Activity ──────────────────────────────────────────────────────
const ministryData = [
  { name: 'Sabbath School', score: 95 },
  { name: 'Music',          score: 91 },
  { name: 'Youth',          score: 78 },
  { name: 'Community Svc',  score: 85 },
  { name: 'Pathfinders',    score: 72 },
  { name: 'Health',         score: 55 },
  { name: "Women's",        score: 68 },
  { name: 'Prayer Group',   score: 45 },
];

export function MinistryActivityChart({ churchName }: { churchName: string }) {
  return (
    <div>
      <ChartHeader title="Ministry Activity" meta={{
        source: 'Church self-reported',
        type: 'Sample data',
        recency: 'Not yet contributed',
        notes: 'Ministry scores reflect activity level and regularity. Data is submitted annually by the church board.'
      }} />
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={ministryData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(124,127,149,0.1)" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#7C7F95' }} tickFormatter={(v) => `${v}%`} />
          <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 10, fill: '#7C7F95' }} />
          <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Bar dataKey="score" fill={TEAL} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <FomoNote text={`${churchName} has not verified ministry data yet. Churches that contribute unlock benchmarking against similar Adventist churches.`} />
    </div>
  );
}

// ── 4. Visitor Retention Funnel ───────────────────────────────────────────────
const funnelData = [
  { stage: 'First Visit',        people: 42, fill: '#a5b4fc' },
  { stage: 'Return Visit',       people: 18, fill: '#818cf8' },
  { stage: 'Regular Attendance', people: 8,  fill: INDIGO },
  { stage: 'Bible Study',        people: 4,  fill: '#4f46e5' },
  { stage: 'Baptism',            people: 2,  fill: '#3730a3' },
];

export function VisitorRetentionChart({ churchName }: { churchName: string }) {
  return (
    <div>
      <ChartHeader title="Visitor Retention Funnel" meta={{
        source: 'Church self-reported',
        type: 'Sample data',
        recency: 'Not yet contributed',
        notes: 'Funnel tracks the journey from first visit to baptism. Submitted by the church\'s evangelism coordinator.'
      }} />
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={funnelData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(124,127,149,0.1)" />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#7C7F95' }} />
          <YAxis type="category" dataKey="stage" width={110} tick={{ fontSize: 10, fill: '#7C7F95' }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Bar dataKey="people" radius={[0, 4, 4, 0]}>
            {funnelData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <FomoNote text={`${churchName} has not contributed visitor tracking data yet. Unlock your real retention funnel.`} />
    </div>
  );
}

// ── Health indicator sparkline (mini) ─────────────────────────────────────────
const sparkData = [62, 71, 68, 75, 72, 80, 77, 85, 82, 88, 84, 90];

export function SparkLine() {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={sparkData.map((v, i) => ({ v, i }))}>
        <Line type="monotone" dataKey="v" stroke={TEAL} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
