import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RYC — estimación de precio",
  description: "Interfaz para el modelo de precios de vehículos de ocasión",
  icons: {
    icon: [{ url: "/ryc_logo.png", type: "image/png" }],
    apple: "/ryc_logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
