import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QPilot - AI Question Paper Generator',
  description: 'Create professional question papers with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}