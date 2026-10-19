import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { AuthProvider } from './hooks/useAuth';
import AppRouter from './router';
import { isRTL } from './lib/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 1,
    },
  },
});

function AppContent() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = isRTL(i18n.language) ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return (
    <>
      <AppRouter />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(13, 13, 26, 0.95)',
            color: '#fff',
            border: '1px solid rgba(255, 107, 157, 0.2)',
            backdropFilter: 'blur(12px)',
          },
          success: { iconTheme: { primary: '#ff6b9d', secondary: '#fff' } },
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
