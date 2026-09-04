import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';

export const metadata = {
  title: 'Scrum Tracker — Systems Edge Solutions',
  description: 'Scrum Meeting Tracker for Systems Edge Solutions — Track daily stand-ups, sprint planning, reviews, and retrospectives.',
  icons: {
    icon: '/icon-logo.png',
    apple: '/icon-logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <div id="toast-container" className="toast-container"></div>
        </AuthProvider>
      </body>
    </html>
  );
}
