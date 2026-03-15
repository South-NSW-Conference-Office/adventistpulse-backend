"use client";

interface Props {
  entity: string;
  breadcrumb: string[];
}

export default function DashboardHeader({ entity, breadcrumb }: Props) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-white">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        {breadcrumb.map((crumb, i) => (
          <span key={crumb} className="flex items-center gap-2">
            {i > 0 && <span className="text-[#D1D5DB] text-[12px]">›</span>}
            <span
              className={`text-[12px] font-semibold tracking-wide uppercase ${
                i === breadcrumb.length - 1
                  ? "text-[#111]"
                  : "text-[#9CA3AF] hover:text-[#111] cursor-pointer"
              }`}
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-[#9CA3AF] uppercase tracking-widest">
          Viewing: <strong className="text-[#111]">{entity}</strong>
        </span>
        <div className="w-px h-4 bg-[#E5E7EB]" />
        <select className="text-[12px] text-[#555] bg-transparent border border-[#E5E7EB] rounded-lg px-3 py-1.5 outline-none cursor-pointer">
          <option>2024</option>
          <option>2023</option>
          <option>2022</option>
          <option>2021</option>
          <option>2020</option>
        </select>
      </div>
    </div>
  );
}
