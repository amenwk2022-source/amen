
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, Calendar, CheckSquare, Menu, X, Gavel, Settings, TrendingUp, Search, Bell, LogOut, Clock, HelpCircle, MessageSquare, Bot, ShieldAlert } from 'lucide-react';
import { db } from '../services/db';
import { authService } from '../services/auth';
import { Case, Client, SessionStatus, TaskStatus } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ cases: Case[], clients: Client[] } | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  // Notification State
  const [notifications, setNotifications] = useState<{ type: 'session' | 'task', id: string, title: string, date: string, urgent: boolean }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const settings = db.getSettings();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update notifications
  useEffect(() => {
    const checkNotifications = () => {
      const today = new Date().toISOString().split('T')[0];
      const allSessions = db.getSessions();
      const allTasks = db.getTasks();
      const allCases = db.getCases();
      
      const newNotifs: typeof notifications = [];
      let hasUrgent = false;

      // Overdue Sessions
      allSessions.filter(s => s.sessionDate < today && s.status === SessionStatus.Upcoming).forEach(s => {
          const caseNum = allCases.find(c => c.id === s.caseId)?.caseNumber || '؟';
          newNotifs.push({
              type: 'session',
              id: s.caseId, // Link to case
              title: `جلسة فائتة: ${caseNum} (${s.sessionType})`,
              date: s.sessionDate,
              urgent: true
          });
          hasUrgent = true;
      });

      // Urgent Pending Tasks
      allTasks.filter(t => t.status === TaskStatus.Pending && t.priority === 'High').forEach(t => {
          newNotifs.push({
              type: 'task',
              id: 'tasks', // Link to tasks page
              title: `مهمة عاجلة: ${t.title}`,
              date: t.dueDate,
              urgent: true
          });
          hasUrgent = true;
      });

      // Send Browser Notification if new urgent items found and not already shown recently
      if (hasUrgent && newNotifs.length > notifications.length && 'Notification' in window && Notification.permission === 'granted') {
         new Notification(settings.officeName, {
             body: `لديك ${newNotifs.length} تنبيهات عاجلة تحتاج للمراجعة`,
             icon: '/vite.svg'
         });
      }

      setNotifications(newNotifs);
    };
    
    checkNotifications();
    const interval = setInterval(checkNotifications, 60000); // Check every minute
    
    // Listen for DB updates
    const handleDbUpdate = () => checkNotifications();
    window.addEventListener('db-update', handleDbUpdate);

    return () => {
        clearInterval(interval);
        window.removeEventListener('db-update', handleDbUpdate);
    };
  }, [location.pathname, notifications.length]); // Re-check on navigation

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 1) {
      const allCases = db.getCases();
      const allClients = db.getClients();
      
      const foundCases = allCases.filter(c => 
        c.caseNumber.includes(query) || 
        c.title.includes(query) || 
        c.opponentName.includes(query)
      ).slice(0, 5);

      const foundClients = allClients.filter(c => 
        c.name.includes(query) || 
        c.phone.includes(query)
      ).slice(0, 5);

      setSearchResults({ cases: foundCases, clients: foundClients });
      setShowResults(true);
    } else {
      setSearchResults(null);
      setShowResults(false);
    }
  };

  const handleLogout = () => {
      if(confirm('هل تود تسجيل الخروج؟')) {
          authService.logout();
      }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/' },
    { icon: Bot, label: 'المساعد الذكي', path: '/ai-assistant' }, // New AI Item
    { icon: Briefcase, label: 'إدارة القضايا', path: '/cases' },
    { icon: ShieldAlert, label: 'إدارة التنفيذ', path: '/execution' }, // Execution
    { icon: MessageSquare, label: 'الاستشارات', path: '/consultations' },
    { icon: Users, label: 'الموكلين', path: '/clients' },
    { icon: Calendar, label: 'رول الجلسات', path: '/calendar' },
    { icon: CheckSquare, label: 'المهام', path: '/tasks' },
    { icon: TrendingUp, label: 'التقارير المالية', path: '/reports' },
    { icon: Settings, label: 'الإعدادات', path: '/settings' },
    { icon: HelpCircle, label: 'المساعدة', path: '/help' },
  ];

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  // Hide Sidebar/Header for Login Page
  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-cairo">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 right-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        no-print flex flex-col
      `}>
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gavel className="w-8 h-8 text-amber-500" />
            <h1 className="text-xl font-bold truncate w-40" title={settings.officeName}>{settings.officeName}</h1>
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isSpecial = item.label === 'المساعد الذكي';
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' 
                    : isSpecial ? 'text-amber-400 hover:bg-slate-800 hover:text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
                {isSpecial && <span className="mr-auto text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">جديد</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
              <span className="font-bold text-amber-500">{settings.lawyerName.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm font-medium truncate w-32">{settings.lawyerName}</p>
              <p className="text-xs text-gray-500">مشرف النظام</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm w-full px-2"
          >
             <LogOut size={16} />
             تسجيل خروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header - Desktop & Mobile */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 md:px-8 no-print">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={toggleSidebar} className="md:hidden text-slate-900">
              <Menu size={24} />
            </button>
            
            {/* Global Search */}
            <div className="relative flex-1 max-w-md hidden md:block" ref={searchRef}>
              <Search className="absolute right-3 top-2.5 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="بحث سريع (رقم قضية، موكل...)"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pr-10 pl-4 py-2 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => searchQuery.length > 1 && setShowResults(true)}
              />
              
              {/* Search Results Dropdown */}
              {showResults && searchResults && (
                <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 max-h-96 overflow-y-auto">
                   {searchResults.cases.length === 0 && searchResults.clients.length === 0 ? (
                     <div className="p-4 text-center text-gray-500 text-sm">لا توجد نتائج.</div>
                   ) : (
                     <>
                       {searchResults.cases.length > 0 && (
                         <div>
                           <h4 className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">القضايا</h4>
                           {searchResults.cases.map(c => (
                             <button 
                               key={c.id}
                               onClick={() => { navigate(`/cases/${c.id}`); setShowResults(false); setSearchQuery(''); }}
                               className="w-full text-right px-4 py-2 hover:bg-gray-50 flex items-center justify-between group"
                             >
                               <div>
                                 <p className="font-bold text-slate-800 text-sm">{c.caseNumber}</p>
                                 <p className="text-xs text-gray-500">{c.title}</p>
                                </div>
                               <Briefcase size={14} className="text-gray-300 group-hover:text-amber-500" />
                             </button>
                           ))}
                         </div>
                       )}
                       {searchResults.clients.length > 0 && (
                         <div className={searchResults.cases.length > 0 ? "border-t mt-2 pt-2" : ""}>
                            <h4 className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">الموكلين</h4>
                            {searchResults.clients.map(c => (
                             <button 
                               key={c.id}
                               onClick={() => { navigate(`/clients/${c.id}`); setShowResults(false); setSearchQuery(''); }}
                               className="w-full text-right px-4 py-2 hover:bg-gray-50 flex items-center justify-between group"
                             >
                               <span className="font-bold text-slate-800 text-sm">{c.name}</span>
                               <Users size={14} className="text-gray-300 group-hover:text-amber-500" />
                             </button>
                           ))}
                         </div>
                       )}
                     </>
                   )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
             {/* Mobile Search Icon */}
             <button className="md:hidden text-gray-500 hover:text-slate-900" onClick={() => document.getElementById('mobile-search')?.focus()}>
               <Search size={22} />
             </button>

             {/* Notifications */}
             <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-1 text-gray-500 hover:text-slate-900 transition-colors"
                >
                  <Bell size={22} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute top-full left-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 max-h-96 overflow-y-auto">
                      <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center">
                        <h4 className="font-bold text-slate-800">التنبيهات</h4>
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{notifications.length} جديد</span>
                      </div>
                      
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 flex flex-col items-center gap-2">
                           <Bell className="text-gray-300 w-8 h-8" />
                           <p className="text-sm">لا توجد تنبيهات جديدة</p>
                        </div>
                      ) : (
                        <div>
                          {notifications.map((notif, idx) => (
                            <button 
                              key={idx}
                              onClick={() => { 
                                if (notif.type === 'session') navigate(`/cases/${notif.id}`);
                                if (notif.type === 'task') navigate('/tasks');
                                setShowNotifications(false);
                              }}
                              className="w-full text-right px-4 py-3 hover:bg-gray-50 flex items-start gap-3 border-b border-gray-50 last:border-0"
                            >
                              <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.urgent ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                              <div>
                                <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                  <Clock size={10} />
                                  {notif.date}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                )}
             </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
           {children}
        </div>
        
        {/* Footer */}
        <footer className="no-print p-4 text-center text-xs text-gray-400 border-t">
            نظام المحامي الذكي v2.1 (مدعوم بالذكاء الاصطناعي) &copy; {new Date().getFullYear()} - {settings.officeName}
        </footer>
      </main>
    </div>
  );
};

export default Layout;