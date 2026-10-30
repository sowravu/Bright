import type { Metadata } from 'next';
import { StoreProvider } from '../store/StoreProvider';
import { ToastProvider } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AIChatBot from '../components/AIChatBot';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bright | Certified Refurbished Smartphones & Accessories',
  description: 'Bright Choices. Smarter Phones. Browse certified refurbished smartphones and mobile accessories online. 100% pre-tested and verified with express pan-India delivery.',
  keywords: ['Refurbished Smartphone', 'Second hand mobile', 'Pre-owned iPhone', 'Used Samsung Galaxy', 'Certified Refurbished', 'India mobile store', 'Smart compare'],
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
