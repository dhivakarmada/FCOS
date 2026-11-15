import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const dynamic = 'force-dynamic';

const interClassName = "font-sans";

export const metadata: Metadata = {
  title: "FCOS - Fulfillment Center Operating System",
  description: "Production-grade multi-tenant logistics and warehouse management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={interClassName}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
