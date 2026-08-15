import type { Metadata } from 'next';
import { StoreProvider } from '../store/StoreProvider';
import { ToastProvider } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AIChatBot from '../components/AIChatBot';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bright | Premium Smartphone Store',
  description: 'Bright Choices. Smarter Phones. Browse our flagship collections of Vivo and Lava smartphones online with direct brand warranty.',
  keywords: ['Vivo', 'Lava', 'Smartphone', 'Buy online', 'India mobile shop', 'Smart compare'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StoreProvider>
          <ToastProvider>
            <Navbar />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '80px' }}>
              {children}
            </main>
            <AIChatBot />
            <Footer />
          </ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
