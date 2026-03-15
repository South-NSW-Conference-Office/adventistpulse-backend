/**
 * AuthPageShell — full-page wrapper for all auth pages.
 * Provides the water background + centered card layout.
 * Single responsibility: page-level layout only.
 */
import WaterBackground from "@/app/components/WaterBackground";

interface Props {
  children: React.ReactNode;
}

export default function AuthPageShell({ children }: Props) {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center">
      <WaterBackground />
      <div
        className="relative z-10 w-full px-4 py-10 mx-auto"
        style={{ maxWidth: 520 }}
      >
        {children}
      </div>
    </main>
  );
}
