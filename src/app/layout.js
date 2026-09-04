import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata = {
  title: 'Scrum Tracker — Systems Edge Solutions',
  description: 'Scrum Meeting Tracker for Systems Edge Solutions — Track daily stand-ups, sprint planning, reviews, and retrospectives.',
  icons: {
    icon: '/icon-logo-dark.png',
    apple: '/icon-logo-dark.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${montserrat.className}`}>
      <body className={montserrat.className}>
        <AuthProvider>
          {children}
          <div id="toast-container" className="toast-container"></div>
        </AuthProvider>
      </body>
    </html>
  );
}
