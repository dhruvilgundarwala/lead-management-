import { Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';

export const DashboardLayout = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
