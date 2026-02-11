import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false, // Don't index interactive tool pages - they're thin/UI-only
    follow: true,
  },
};

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return children;
}
