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
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.className} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
      <Script id="intercom-init" strategy="afterInteractive">{`
        window.intercomSettings={api_base:"https://api-ius.intercom.io",app_id:"pelltlav"};
        (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic("reattach_activator");ic("update",w.intercomSettings)}else{var d=document;var i=function(){i.c(arguments)};i.q=[];i.c=function(args){i.q.push(args)};w.Intercom=i;var l=function(){var s=d.createElement("script");s.type="text/javascript";s.async=true;s.src="https://widget.intercom.io/widget/pelltlav";var x=d.getElementsByTagName("script")[0];x.parentNode.insertBefore(s,x)};if(document.readyState==="complete"){l()}else{w.addEventListener("load",l,false)}}})();
      `}</Script>
    </html>
  );
}
