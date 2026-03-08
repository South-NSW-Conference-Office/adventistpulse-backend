interface Props {
  label: string;
  value: string;
  sub?: string;
  trend?: number; // percentage, positive or negative
  color?: string;
}

export default function StatCard({ label, value, sub, trend, color = "#2563EB" }: Props) {
  const isUp = trend !== undefined && trend >= 0;

  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-1 border border-[#F0F0F0] shadow-sm hover:shadow-md transition-shadow">
      <p className="text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF]">
        {label}
      </p>
      <p className="text-[28px] font-black text-[#0A0A0A] leading-none mt-1">
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-[#9CA3AF]">{sub}</p>
      )}
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-1">
          <span
            className="text-[11px] font-semibold"
            style={{ color: isUp ? "#16A34A" : "#DC2626" }}
          >
            {isUp ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}% YoY
          </span>
        </div>
      )}
      {/* Accent bar */}
      <div
        className="mt-2 h-0.5 w-8 rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}
