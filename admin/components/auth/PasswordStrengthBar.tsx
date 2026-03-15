/**
 * PasswordStrengthBar — 4-segment visual strength indicator.
 * Purely presentational. Receives a score 0-4 from the parent.
 * No zxcvbn client-side — backend is the authority on rules.
 * Frontend gives a visual hint; backend provides the authoritative error.
 */

interface Props {
  score: number; // 0 = empty, 1 = very weak, 2 = weak, 3 = fair, 4 = strong
}

const LEVELS = [
  { label: "",            color: "#E5E7EB" },
  { label: "Very Weak",  color: "#EF4444" },
  { label: "Weak",       color: "#F97316" },
  { label: "Fair",       color: "#EAB308" },
  { label: "Strong",     color: "#16A34A" },
];

export function calcPasswordScore(password: string): number {
  if (!password) return 0;
  let score = 1;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

export default function PasswordStrengthBar({ score }: Props) {
  if (score === 0) return null;

  const level = LEVELS[score] ?? LEVELS[1];

  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? level.color : "#E5E7EB" }}
          />
        ))}
      </div>
      <p className="text-[11px] font-medium" style={{ color: level.color }}>
        {level.label}
      </p>
    </div>
  );
}
