import type { Metadata, Viewport } from "next";
// Шрифты хранятся локально (без запросов к Google): кириллица + латиница
import "@fontsource/cormorant-garamond/cyrillic-300.css";
import "@fontsource/cormorant-garamond/cyrillic-400.css";
import "@fontsource/cormorant-garamond/cyrillic-500.css";
import "@fontsource/cormorant-garamond/cyrillic-400-italic.css";
import "@fontsource/cormorant-garamond/latin-300.css";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-400-italic.css";
import "@fontsource-variable/manrope/index.css";
import { SALON } from "@/config/salon";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${SALON.name} — ${SALON.tagline}`, template: `%s — ${SALON.name}` },
  description: "Студия красоты в центре Москвы: стрижки, окрашивание, ногтевой сервис, брови и уход за лицом. Онлайн-запись к мастеру.",
};

export const viewport: Viewport = { themeColor: "#f5f1ea" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
