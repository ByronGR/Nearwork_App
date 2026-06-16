import "./globals.css";
import { JetBrains_Mono, Poppins } from "next/font/google";
import Script from "next/script";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata = {
  title: "Nearwork Client Portal",
  description: "Nearwork hiring command center for client candidate decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.className} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
      <Script
        id="hs-script-loader"
        strategy="afterInteractive"
        src="https://js-na1.hs-scripts.com/51335115.js"
      />
    </html>
  );
}
