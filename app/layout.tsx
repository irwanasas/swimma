import type { Metadata } from "next";
import { Lexend, Source_Sans_3 } from "next/font/google";
import { Toaster } from "sonner";
import { APP_NAME } from "@/lib/config";
import { ThemeProvider } from "@/components/shared/theme-provider";
import "./globals.css";

const heading = Lexend({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--nf-heading",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--nf-sans",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Manajemen klub renang anak",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`h-full antialiased ${heading.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
