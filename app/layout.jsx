import "./globals.css";

export const metadata = {
  title: "Electrical Proposal Builder",
  description: "Generate contractor-ready electrical proposals from a structured questionnaire.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
