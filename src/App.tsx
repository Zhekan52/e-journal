import { AuthProvider, DataProvider, useAuth, useData } from './context';
import { Login } from './components/Login';
import { StudentView } from './components/StudentView';
import { AdminView } from './components/AdminView';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 50%, #cbd5e1 100%)' }}>
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
      <p className="text-slate-700 text-lg font-semibold">Загрузка данных...</p>
      <p className="text-slate-500 text-sm mt-2">Подключение к базе данных</p>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const { loading } = useData();

  if (!user) return <Login />;
  if (loading) return <LoadingScreen />;
  if (user.role === 'admin') return <AdminView />;
  return <StudentView />;
};

export function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
