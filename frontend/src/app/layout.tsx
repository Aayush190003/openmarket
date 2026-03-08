import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomBar from "@/components/BottomBar";
import { Particles, ButtonTilt } from "@/components/Effects";
import { AuthProvider } from "@/context/AuthContext";
import Script from "next/script";

export const metadata: Metadata = {
  title: "OpenMarket - Cricket Prediction Market",
  description: "Predict cricket match outcomes and win real cash. Trade on live matches, player performances, and innings scores.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <Particles count={15} />
          <ButtonTilt />
          <Navbar />
          {children}
          <BottomBar />
        </AuthProvider>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
