import { AuthProvider, DataProvider, useAuth, useData } from './context';
import { Login } from './components/Login';
import { StudentView } from './components/StudentView';
import { AdminView } from './components/AdminView';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-14 h-14 border-3 border-primary-200 border-t-accent-500 rounded-full animate-spin mx-auto mb-6" />
      <p className="text-primary-700 text-base font-medium">Загрузка данных...</p>
      <p className="text-primary-400 text-sm mt-2 font-light">Подключение к базе данных</p>
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
