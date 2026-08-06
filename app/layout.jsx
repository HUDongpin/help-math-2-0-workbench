import "./globals.css";

export const metadata = {
  title: "Flash Conversion Rebuild",
  description:
    "HTML5/SVG reconstruction of a Flash 6 capacity-conversion teaching animation.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
