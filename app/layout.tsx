import type { Metadata } from "next";
import CommunityChatbot from "@/components/CommunityChatbot";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kaam Ka Saathi | Share, Help, Reuse",
  description:
    "Share useful items, find local help, and connect with your community through Kaam Ka Saathi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CommunityChatbot />
      </body>
    </html>
  );
}
