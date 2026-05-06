import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
