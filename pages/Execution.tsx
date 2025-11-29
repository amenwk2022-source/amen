
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Case, CaseStatus, ExecutionProcedure } from '../types';
import { Link } from 'react-router-dom';
import { ShieldAlert, Search, Filter, Briefcase, CheckCircle, Clock } from 'lucide-react';

const Execution: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    // Load cases that are in execution or closed
    setCases(db.getCases().filter(c => c.status === CaseStatus.Execution));
  }, []);

  const getExecutionsForCase = (caseId: string) => {
      return db.getExecutions().filter(e => e.caseId === caseId);
  };

  const filteredCases = cases.filter(c => {
      return c.title.includes(searchTerm) || c.caseNumber.includes(searchTerm) || c.opponentName.includes(searchTerm);
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="text-purple-600" />
                إدارة التنفيذ
            </h1>
            <p className="text-gray-500">متابعة قرارات التنفيذ (34، 46) والتحصيلات</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-2.5 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="بحث في قضايا التنفيذ..."
            className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredCases.map(c => {
            const execs = getExecutionsForCase(c.id);
            const pendingExecs = execs.filter(e => e.status === 'pending');
            return (
                <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 hover:border-purple-200 transition-colors">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">تنفيذ</span>
                            <span className="text-gray-400 text-sm">#{c.caseNumber}</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1">{c.title}</h3>
                        <p className="text-sm text-gray-500 mb-4">ضد: {c.opponentName}</p>
                        
                        <div className="flex gap-4 text-sm">
                            <div className="bg-gray-50 px-3 py-1 rounded">
                                <span className="text-gray-500 block text-xs">إجمالي المطالبة</span>
                                <span className="font-bold">{c.financialTotal.toLocaleString()}</span>
                            </div>
                             <div className="bg-green-50 px-3 py-1 rounded">
                                <span className="text-green-600 block text-xs">تم تحصيل</span>
                                <span className="font-bold text-green-700">{c.financialPaid.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 border-r pr-6 md:border-r md:pr-6 border-gray-100">
                        <h4 className="font-bold text-sm text-slate-700 mb-3">آخر الإجراءات</h4>
                        {execs.length > 0 ? (
                            <ul className="space-y-3">
                                {execs.slice(0, 3).map(e => (
                                    <li key={e.id} className="flex items-center gap-2 text-sm">
                                        {e.status === 'completed' ? <CheckCircle size={14} className="text-green-500"/> : <Clock size={14} className="text-amber-500"/>}
                                        <span className={e.status === 'completed' ? 'text-gray-400 line-through' : 'text-slate-800'}>{e.type}</span>
                                        <span className="text-xs text-gray-400 mr-auto">{e.date}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-400 italic">لا توجد إجراءات مسجلة</p>
                        )}
                    </div>

                    <div className="flex flex-col justify-center gap-2">
                         <Link to={`/cases/${c.id}`} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm text-center hover:bg-purple-700">
                            إدارة التنفيذ
                         </Link>
                         <span className="text-xs text-center text-gray-400">
                             {pendingExecs.length} إجراء معلق
                         </span>
                    </div>
                </div>
            );
        })}
        {filteredCases.length === 0 && (
            <div className="text-center py-12 text-gray-500">
                لا توجد قضايا في مرحلة التنفيذ حالياً.
            </div>
        )}
      </div>
    </div>
  );
};

export default Execution;