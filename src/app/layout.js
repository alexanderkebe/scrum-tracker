import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import StartupSplash from '@/components/StartupSplash';

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
    <html lang="en">
      <body>
        <AuthProvider>
          <StartupSplash>{children}</StartupSplash>
          <div id="toast-container" className="toast-container"></div>
        </AuthProvider>
      </body>
    </html>
  );
}
