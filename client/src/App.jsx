import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { ShieldAlert, XCircle } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { SocketProvider } from './context/SocketContext';
import Sidebar from './components/common/Sidebar';
import TopBar from './components/common/TopBar';
import DashboardAnalytics from './components/common/DashboardAnalytics';
import LoginPage from './pages/auth/LoginPage';

// Code Splitting: Lazy-load role portals and recap view
const DoctorPortal = lazy(() => import('./pages/doctor/DoctorPortal'));
const PharmacyPortal = lazy(() => import('./pages/pharmacy/PharmacyPortal'));
const AdminPortal = lazy(() => import('./pages/admin/AdminPortal'));
const ReportRecapView = lazy(() => import('./components/common/ReportRecapView'));

function PortalFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[350px] p-8 text-center">
      <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3 shadow-md" />
      <p className="text-xs font-semibold text-slate-500">Memuat modul kerja klinik...</p>
    </div>
  );
}

// Role routes definitions to prevent URL link modification bypass
const ROUTE_RULES = {
  admin: {
    name: 'Admin Logistik',
    defaultTab: 'dashboard',
    allowedKeywords: ['admin', 'logistik', 'inventory_master', 'restock_batches', 'returns_audit', 'logistics_overview', 'dashboard', 'reports', 'laporan'],
    subtabs: ['dashboard', 'reports', 'inventory_master', 'restock_batches', 'returns_audit', 'logistics_overview']
  },
  dokter: {
    name: 'Dokter Spesialis',
    defaultTab: 'dashboard',
    allowedKeywords: ['dokter', 'doctor', 'write_prescription', 'prescription_history', 'medicine_catalog', 'dashboard', 'reports', 'laporan'],
    subtabs: ['dashboard', 'reports', 'write_prescription', 'prescription_history', 'medicine_catalog']
  },
  apoteker: {
    name: 'Apoteker FEFO',
    defaultTab: 'dashboard',
    allowedKeywords: ['apoteker', 'pharmacy', 'farmasi', 'queue_dispensing', 'expiry_monitoring', 'damage_report', 'dispensed_history', 'dashboard', 'reports', 'laporan'],
    subtabs: ['dashboard', 'reports', 'queue_dispensing', 'expiry_monitoring', 'damage_report', 'dispensed_history']
  }
};

function MainApp() {
  const { currentUser, logout } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [securityAlert, setSecurityAlert] = useState(null);

  const activeSubTabRef = useRef(activeSubTab);
  useEffect(() => {
    activeSubTabRef.current = activeSubTab;
  }, [activeSubTab]);

  // Validate URL against user role and guard against link modification bypass
  const validateRouteAndSync = useCallback((role, currentTab) => {
    const fullPath = window.location.pathname.toLowerCase();
    const segments = fullPath.split('/').filter(Boolean);
    const primarySegment = segments[0] || '';
    const secondarySegment = segments[1] || '';

    // If user is not logged in, enforce /login
    if (!role) {
      if (fullPath !== '/login') {
        window.history.replaceState(null, '', '/login');
      }
      return;
    }

    // If user explicitly navigates to /login while logged in, log out to show the login screen cleanly
    if (fullPath === '/login') {
      logout();
      return;
    }

    const myRules = ROUTE_RULES[role];
    if (!myRules) return;

    // Check if the requested path belongs to another role (e.g. /admin, /dokter, /apoteker)
    let targetRole = null;
    if (primarySegment === 'admin' || primarySegment === 'logistik') targetRole = 'admin';
    else if (primarySegment === 'dokter' || primarySegment === 'doctor') targetRole = 'dokter';
    else if (primarySegment === 'apoteker' || primarySegment === 'pharmacy' || primarySegment === 'farmasi') targetRole = 'apoteker';

    // 1. BLOCKED CASE: User tries to access another role's route via link modification
    if (targetRole && targetRole !== role) {
      const targetName = ROUTE_RULES[targetRole]?.name || targetRole.toUpperCase();
      const myName = myRules.name;

      setSecurityAlert({
        title: 'Akses Ditolak (403 Forbidden)',
        message: `Percobaan membuka rute '/${primarySegment}' diblokir! Akun Anda terautentikasi sebagai '${myName}', bukan '${targetName}'. URL telah dikembalikan secara aman ke ruang kerja Anda.`
      });

      // Normalize URL back to safe authorized route
      const safeTab = (currentTab && myRules.subtabs.includes(currentTab)) ? currentTab : 'dashboard';
      setActiveSubTab(safeTab);
      window.history.replaceState(null, '', `/${role}/${safeTab}`);
      return;
    }

    // 2. ALLOWED CASE: Path is within the current user's role (e.g. /admin, /admin/inventory_master, /admin/dashboard)
    if (targetRole === role) {
      if (secondarySegment && myRules.subtabs.includes(secondarySegment)) {
        setActiveSubTab(secondarySegment);
        return;
      }
      setActiveSubTab('dashboard');
      window.history.replaceState(null, '', `/${role}/dashboard`);
      return;
    }

    // 3. Direct subtab in path (e.g. /write_prescription or /inventory_master or /dashboard)
    if (myRules.subtabs.includes(primarySegment)) {
      setActiveSubTab(primarySegment);
      window.history.replaceState(null, '', `/${role}/${primarySegment}`);
      return;
    }

    // 4. Default safe fallback for all other routes ('/', unknown path)
    setActiveSubTab('dashboard');
    window.history.replaceState(null, '', `/${role}/dashboard`);
  }, [logout]);

  // Handle initial page load and route validation
  useEffect(() => {
    if (!currentUser) {
      if (window.location.pathname !== '/login') {
        window.history.replaceState(null, '', '/login');
      }
      return;
    }

    validateRouteAndSync(currentUser.role, activeSubTabRef.current);

    // Listen to browser Back/Forward navigation to prevent link bypass
    const handlePopState = () => {
      validateRouteAndSync(currentUser.role, activeSubTabRef.current);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser, validateRouteAndSync]);

  // Handle tab switching and URL synchronization
  const handleTabChange = (newTab) => {
    setActiveSubTab(newTab);
    setSecurityAlert(null);
    if (currentUser) {
      window.history.pushState(null, '', `/${currentUser.role}/${newTab}`);
    }
  };

  // If user is not authenticated, strictly show the Login Panel
  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex bg-[#edf6fb] text-slate-800 font-sans">
      {/* 1. Left Sidebar Navigation (Strictly Role-Guarded) */}
      <Sidebar 
        activeSubTab={activeSubTab} 
        setActiveSubTab={handleTabChange}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Context Header & Royal Blue Banner */}
        <TopBar 
          activeSubTab={activeSubTab} 
          setActiveSubTab={handleTabChange}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />

        {/* Security Alert Toast (Shown if link modification / bypass attempt occurs) */}
        {securityAlert && (
          <div className="mx-6 lg:mx-8 mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-md flex items-start justify-between gap-3 animate-bounce-once">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/30">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs sm:text-sm text-rose-950">
                  {securityAlert.title}
                </h4>
                <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                  {securityAlert.message}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSecurityAlert(null)}
              className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-100 cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Dedicated Workspace View based on Logged-in Role */}
        <main className="flex-1 p-3 sm:p-5 lg:p-8 -mt-2">
          <Suspense fallback={<PortalFallback />}>
            {activeSubTab === 'reports' ? (
              <ReportRecapView />
            ) : activeSubTab === 'dashboard' || !ROUTE_RULES[currentUser?.role]?.subtabs.includes(activeSubTab) ? (
              <DashboardAnalytics setActiveSubTab={handleTabChange} />
            ) : (
              <>
                {currentUser.role === 'dokter' && (
                  <DoctorPortal activeSubTab={activeSubTab} />
                )}

                {currentUser.role === 'apoteker' && (
                  <PharmacyPortal activeSubTab={activeSubTab} />
                )}

                {currentUser.role === 'admin' && (
                  <AdminPortal activeSubTab={activeSubTab} />
                )}
              </>
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainApp />
      </SocketProvider>
    </AuthProvider>
  );
}
