/**
 * AuthInput — labeled input field with optional left icon.
 * Single responsibility: one input field. No logic.
 */
interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
}

export default function AuthInput({ label, icon, error, ...inputProps }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
        {label}
      </label>
      <div
        className="flex items-center gap-3 px-4 transition-shadow"
        style={{
          background:   "#f7f7f7",
          border:       `1px solid ${error ? "#FCA5A5" : "#e0e0e0"}`,
          borderRadius: 12,
          height:       50,
        }}
      >
        {icon && <span className="text-[#aaa] shrink-0">{icon}</span>}
        <input
          {...inputProps}
          className="flex-1 bg-transparent outline-none text-[14px] text-[#1a1a1a] placeholder-[#aaa]"
        />
      </div>
      {error && (
        <p className="text-[11px] text-red-500 leading-snug">{error}</p>
      )}
    </div>
  );
}
