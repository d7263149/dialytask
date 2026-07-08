import "./globals.css";
import GlobalClockWidget from "@/components/GlobalClockWidget";

export const metadata = {
  title: "KD Protek — Daily Register",
  description: "Roz ki disciplined routine ka ledger — sattu, gym, study, sab kuch trace karo.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-bg text-ink font-body">
        <GlobalClockWidget />
        <div id="page-content-wrap" className="flex flex-col flex-1 min-h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
