import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Image Style Transfer - WebAssembly & Rust",
  description:
    "Transform your images with AI-powered style transfer using WebAssembly and Rust",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen relative overflow-hidden text-gray-200">
          {/* Background gradient + noise */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-ink-900 to-black opacity-95" />
          <div
            className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-20"
            style={{
              backgroundImage:
                "url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100%\\' height=\\'100%\\'><filter id=\\'n\\'><feTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.8\\' numOctaves=\\'2\\' stitchTiles=\\'stitch\\'/></filter><rect width=\\'100%\\' height=\\'100%\\' filter=\\'url(#n)\\' opacity=\\'0.03\\'/></svg>')",
            }}
          />
          {children}
        </div>
      </body>
    </html>
  );
}
