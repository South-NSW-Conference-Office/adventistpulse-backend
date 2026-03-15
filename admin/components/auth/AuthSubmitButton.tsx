/**
 * AuthSubmitButton — full-width submit button with loading state.
 * Single responsibility: the submit action. No logic.
 */
interface Props {
  label: string;
  loadingLabel?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function AuthSubmitButton({
  label,
  loadingLabel,
  isLoading = false,
  disabled = false,
}: Props) {
  return (
    <button
      type="submit"
      disabled={isLoading || disabled}
      className="w-full text-white text-[15px] font-semibold transition-opacity hover:opacity-80 active:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      style={{
        background:   "#111111",
        borderRadius: 30,
        height:       50,
        border:       "none",
        cursor:       isLoading || disabled ? "not-allowed" : "pointer",
      }}
    >
      {isLoading && (
        <svg
          className="animate-spin"
          width="16" height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="white" className="opacity-75" />
        </svg>
      )}
      {isLoading ? (loadingLabel ?? label) : label}
    </button>
  );
}
