
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Session, SessionStatus, CaseStatus, Task, TaskStatus } from '../types';
import { Scale, Users, FileText, AlertTriangle, Clock, CheckSquare, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    closedCases: 0,
    totalClients: 0,
    monthlyIncome: 0
  });
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [overdueSessions, setOverdueSessions] = useState<Session[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const settings = db.getSettings();

  const loadData = () => {
    const cases = db.getCases();
    const clients = db.getClients();
    const sessions = db.getSessions();
    const tasks = db.getTasks();
    const payments = db.getPayments();

    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const monthlyIncome = payments
        .filter(p => p.date.startsWith(currentMonth))
        .reduce((sum, p) => sum + p.amount, 0);
    
    setStats({
      totalCases: cases.length,
      activeCases: cases.filter(c => c.status === CaseStatus.Active).length,
      closedCases: cases.filter(c => c.status === CaseStatus.Closed).length,
      totalClients: clients.length,
      monthlyIncome
    });

    const today = new Date().toISOString().split('T')[0];
    
    // Sessions for today and tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    setTodaySessions(
      sessions
        .filter(s => (s.sessionDate === today || s.sessionDate === tomorrowStr) && s.status === SessionStatus.Upcoming)
        .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))
    );

    // Overdue sessions (past date but still 'Upcoming')
    setOverdueSessions(
      sessions
        .filter(s => s.sessionDate < today && s.status === SessionStatus.Upcoming)
    );

    // Pending Tasks
    setPendingTasks(
      tasks.filter(t => t.status === TaskStatus.Pending).slice(0, 5)
    );
  };

  useEffect(() => {
    loadData();
    
    // Listen for DB updates to refresh dashboard in real-time
    const handleDbUpdate = () => loadData();
    window.addEventListener('db-update', handleDbUpdate);
    window.addEventListener('storage', handleDbUpdate); // Cross-tab sync

    return () => {
        window.removeEventListener('db-update', handleDbUpdate);
        window.removeEventListener('storage', handleDbUpdate);
    };
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  // Calculate percentages for the simple pie chart
  const activePercent = stats.totalCases > 0 ? (stats.activeCases / stats.totalCases) * 100 : 0;
  const closedPercent = stats.totalCases > 0 ? (stats.closedCases / stats.totalCases) * 100 : 0;
  // Others (Under Filing etc)
  const otherPercent = 100 - activePercent - closedPercent;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">لوحة التحكم</h1>
          <p className="text-gray-500 mt-1">نظرة عامة على نشاط {settings.officeName}</p>
        </div>
        <div className="text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-100">
          {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي القضايا" value={stats.totalCases} icon={Scale} color="bg-slate-900" />
        <StatCard title="القضايا المتداولة" value={stats.activeCases} icon={FileText} color="bg-amber-600" />
        <StatCard title="دخل الشهر الحالي" value={stats.monthlyIncome.toLocaleString()} subtext={settings.currency} icon={TrendingUp} color="bg-green-600" />
        <StatCard title="عدد الموكلين" value={stats.totalClients} icon={Users} color="bg-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Right Column: Alerts & Chart */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Simple Case Distribution Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-slate-800 mb-4">توزيع القضايا</h3>
                {stats.totalCases > 0 ? (
                    <div className="flex items-center gap-6">
                        <div className="relative w-32 h-32 rounded-full" style={{
                            background: `conic-gradient(
                                #d97706 0% ${activePercent}%, 
                                #16a34a ${activePercent}% ${activePercent + closedPercent}%, 
                                #cbd5e1 ${activePercent + closedPercent}% 100%
                            )`
                        }}>
                            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                                <span className="font-bold text-gray-400 text-xs">توزيع الحالات</span>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-amber-600"></span>
                                <span>متداولة ({Math.round(activePercent)}%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-600"></span>
                                <span>منتهية ({Math.round(closedPercent)}%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                                <span>أخرى ({Math.round(otherPercent)}%)</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-10 text-center text-gray-500 text-sm">لا توجد قضايا لعرض الرسم البياني</div>
                )}
            </div>

            {/* Urgent Alerts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-red-50 flex items-center justify-between">
                <h3 className="font-bold text-red-800 flex items-center gap-2">
                <AlertTriangle size={18} />
                جلسات لم ترحل
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${overdueSessions.length > 0 ? 'bg-red-200 text-red-800 font-bold' : 'bg-gray-100 text-gray-500'}`}>{overdueSessions.length}</span>
            </div>
            <div className="p-0">
                {overdueSessions.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                    لا توجد جلسات فائتة.
                </div>
                ) : (
                <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                    {overdueSessions.map(session => (
                    <li key={session.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-800">قضية {db.getCases().find(c => c.id === session.caseId)?.caseNumber}</p>
                            <p className="text-xs text-red-600 mt-1 font-semibold">{session.sessionDate}</p>
                        </div>
                        <Link 
                            to={`/cases/${session.caseId}`}
                            className="text-xs bg-slate-900 text-white px-3 py-1 rounded hover:bg-slate-800"
                        >
                            ترحيل
                        </Link>
                        </div>
                    </li>
                    ))}
                </ul>
                )}
            </div>
            </div>

            {/* Tasks Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <CheckSquare size={18} />
                    مهام معلقة
                    </h3>
                </div>
                <ul className="divide-y divide-gray-100">
                    {pendingTasks.map(task => (
                        <li key={task.id} className="p-3 hover:bg-gray-50 flex items-start gap-3">
                            <div className="mt-1 w-2 h-2 rounded-full bg-amber-500 shrink-0"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">{task.title}</p>
                                <p className="text-xs text-gray-500 flex justify-between mt-1">
                                    <span>{task.assignee}</span>
                                    <span className="text-amber-600">{task.dueDate}</span>
                                </p>
                            </div>
                        </li>
                    ))}
                    {pendingTasks.length === 0 && (
                        <li className="p-6 text-center text-gray-500 text-sm">لا توجد مهام معلقة.</li>
                    )}
                </ul>
                <div className="p-3 border-t bg-gray-50 text-center">
                    <Link to="/tasks" className="text-xs text-slate-600 font-bold hover:text-amber-600">
                    إدارة المهام &larr;
                    </Link>
                </div>
            </div>
        </div>

        {/* Sessions Column */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock size={18} />
                جلسات اليوم والغد
                </h3>
                <Link to="/calendar" className="text-sm text-amber-600 font-medium hover:text-amber-700">
                 الرول الكامل
                </Link>
            </div>
            <div className="p-0 flex-1 overflow-y-auto">
                {todaySessions.length === 0 ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                    <Clock size={48} className="text-gray-300 mb-4" />
                    <p>لا توجد جلسات مجدولة لليوم أو الغد.</p>
                </div>
                ) : (
                <ul className="divide-y divide-gray-100">
                    {todaySessions.map(session => {
                    const isToday = session.sessionDate === new Date().toISOString().split('T')[0];
                    const caseInfo = db.getCases().find(c => c.id === session.caseId);
                    return (
                        <li key={session.id} className="p-4 hover:bg-gray-50 transition-colors border-r-4 border-r-transparent hover:border-r-amber-500">
                        <div className="flex justify-between items-center">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isToday ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {isToday ? 'اليوم' : 'غداً'}
                                    </span>
                                    <span className="text-sm font-bold text-slate-800">
                                    {caseInfo?.title}
                                    </span>
                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{caseInfo?.caseNumber}</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                {session.sessionType} - <span className="text-gray-500">{caseInfo?.court}</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                القاضي: {session.judgeName}
                                </p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Link to={`/cases/${session.caseId}`} className="text-xs border border-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-slate-900 hover:text-white transition-colors">
                                    التفاصيل
                                </Link>
                            </div>
                        </div>
                        </li>
                    );
                    })}
                </ul>
                )}
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;