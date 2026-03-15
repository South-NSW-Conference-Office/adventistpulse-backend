const ALERTS = [
  { entity: "Wollongong SDA",     type: "At Risk",  detail: "3 consecutive years of membership decline",   color: "#F97316" },
  { entity: "Nowra SDA",          type: "Critical", detail: "No baptisms in 24 months, tithe down 18%",    color: "#DC2626" },
  { entity: "Goulburn SDA",       type: "Watch",    detail: "Membership plateaued, attendance declining",  color: "#EAB308" },
  { entity: "Queanbeyan SDA",     type: "At Risk",  detail: "Members per pastor exceeds 180",              color: "#F97316" },
];

const TYPE_STYLES: Record<string, string> = {
  Critical: "bg-red-50 text-red-600 border-red-200",
  "At Risk": "bg-orange-50 text-orange-600 border-orange-200",
  Watch:     "bg-yellow-50 text-yellow-600 border-yellow-200",
};

export default function AlertsStrip() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#F0F0F0] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF]">
          ⚠ Early Warnings
        </p>
        <span className="text-[10px] text-blue-600 cursor-pointer hover:underline">
          View all →
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {ALERTS.map((alert) => (
          <div
            key={alert.entity}
            className="shrink-0 flex flex-col gap-1.5 bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl px-4 py-3 cursor-pointer hover:border-[#D1D5DB] transition-colors min-w-[220px]"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: alert.color }}
              />
              <span className="text-[12px] font-bold text-[#0A0A0A] truncate">
                {alert.entity}
              </span>
            </div>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border w-fit ${TYPE_STYLES[alert.type]}`}
            >
              {alert.type}
            </span>
            <p className="text-[11px] text-[#6B7280] leading-snug">{alert.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
