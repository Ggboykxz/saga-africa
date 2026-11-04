import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { ToastProvider } from "@/lib/toast";
import { ThemeProvider } from "@/lib/theme";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Saga Africa — Là où l'Afrique raconte ses mondes",
    template: "%s · Saga Africa",
  },
  description:
    "Lisez des mangas, webtoons, nolovels et light novels gratuits — et publiez les vôtres. La plateforme des sagas africaines et francophones.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <I18nProvider>
          <ThemeProvider>
            <ToastProvider>
              <Navbar />
              <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</main>
              <Footer />
            </ToastProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
