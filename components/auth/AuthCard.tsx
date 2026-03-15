/**
 * AuthCard — white card with logo, title, subtitle, optional back link.
 * Used by every auth page. Single responsibility: card chrome only.
 */
import Image from "next/image";
import Link from "next/link";

interface Props {
  title: string;
  subtitle?: string;
  backLink?: { label: string; href: string };
  children: React.ReactNode;
}

export default function AuthCard({ title, subtitle, backLink, children }: Props) {
  return (
    <div
      className="w-full bg-white rounded-3xl px-8 py-9 flex flex-col gap-6 box-border"
      style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center gap-2">
        <Image
          src="/adventist-logo.png"
          alt="Adventist Pulse"
          width={48}
          height={48}
          priority
        />
        <span className="text-[22px] font-bold text-[#1a1a1a] tracking-tight">
          Adventist Pulse
        </span>
      </div>

      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] font-bold text-[#111111] leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-[#9CA3AF] leading-snug">{subtitle}</p>
        )}
      </div>

      {/* Page content */}
      <div className="flex flex-col gap-4">{children}</div>

      {/* Back link */}
      {backLink && (
        <p className="text-[12px] text-[#9CA3AF] text-center">
          <Link
            href={backLink.href}
            className="text-[#1a1a1a] font-semibold hover:underline"
          >
            ← {backLink.label}
          </Link>
        </p>
      )}
    </div>
  );
}
