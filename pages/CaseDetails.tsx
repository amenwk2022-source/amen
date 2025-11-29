
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GoogleGenAI, Type } from "@google/genai";
import { db } from '../services/db';
import { Case, Session, SessionStatus, CaseStatus, CaseDocument, Task, TaskStatus, TaskPriority, Payment, CaseExpense, Client, ExecutionProcedure } from '../types';
import { Calendar, FileText, DollarSign, Gavel, CheckCircle, AlertCircle, ArrowRight, Download, Upload, Plus, Edit2, Timer, Printer, CheckSquare, Square, User, Trash2, X, AlertTriangle, TrendingDown, Clock, Activity, MessageCircle, Sparkles, Loader2, Bot, PlayCircle, ShieldAlert } from 'lucide-react';

const CaseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<CaseExpense[]>([]);
  const [executions, setExecutions] = useState<ExecutionProcedure[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'documents' | 'financial' | 'tasks' | 'execution'>('overview');
  
  // Modal State
  const [sessionToMigrate, setSessionToMigrate] = useState<Session | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showJudgmentModal, setShowJudgmentModal] = useState(false);
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  
  // AI Analysis State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [isExtractingTasks, setIsExtractingTasks] = useState(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const settings = db.getSettings();

  useEffect(() => {
    refreshData();
  }, [id]);

  const refreshData = () => {
    if (id) {
        const c = db.getCases().find(c => c.id === id);
        if (c) {
          setCaseData(c);
          setClient(db.getClients().find(cl => cl.id === c.clientId) || null);
          setSessions(db.getSessions().filter(s => s.caseId === id).sort((a, b) => b.sessionDate.localeCompare(a.sessionDate)));
          setDocuments(db.getDocuments().filter(d => d.caseId === id));
          setTasks(db.getTasks().filter(t => t.caseId === id));
          setPayments(db.getPayments().filter(p => p.caseId === id).sort((a,b) => b.date.localeCompare(a.date)));
          setExpenses(db.getExpenses().filter(e => e.caseId === id).sort((a,b) => b.date.localeCompare(a.date)));
          setExecutions(db.getExecutions().filter(e => e.caseId === id).sort((a,b) => b.date.localeCompare(a.date)));
          
          if(c.status === CaseStatus.Execution) {
              setActiveTab('execution');
          }
        }
      }
  };

  if (!caseData) return <div>جاري التحميل...</div>;

  const handlePrint = () => {
      window.print();
  };

  const handleDeleteCase = () => {
    if(confirm('هل أنت متأكد من حذف هذه القضية وكافة بياناتها؟ لا يمكن التراجع عن هذا الإجراء.')) {
      db.deleteCase(caseData.id);
      // Clean up linked data
      sessions.forEach(s => db.deleteSession(s.id));
      tasks.forEach(t => db.deleteTask(t.id));
      documents.forEach(d => db.deleteDocument(d.id));
      payments.forEach(p => db.deletePayment(p.id));
      expenses.forEach(e => db.deleteExpense(e.id));
      navigate('/cases');
    }
  };

  // --- Actions ---

  const handleActivateCase = () => {
      if(confirm('هل تم قيد الدعوى في المحكمة رسمياً؟ سيتم تغيير الحالة إلى "متداولة".')) {
          const updated: Case = { ...caseData, status: CaseStatus.Active };
          db.updateCase(updated);
          setCaseData(updated);
          // Force refresh to update UI state properly
          refreshData();
      }
  };

  const handleMoveToExecution = () => {
      if (!caseData) return;
      if(confirm('هل تريد نقل القضية إلى مرحلة التنفيذ؟')) {
          const updated: Case = { ...caseData, status: CaseStatus.Execution };
          db.updateCase(updated);
          setCaseData(updated);
          setActiveTab('execution');
          alert('تم نقل القضية لمرحلة التنفيذ. يمكنك الآن إضافة إجراءات التنفيذ.');
      }
  };

  const handleAddExecution = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      
      const newExec: ExecutionProcedure = {
          id: Date.now().toString(),
          caseId: caseData.id,
          type: fd.get('type') as string,
          date: fd.get('date') as string,
          status: 'pending',
          notes: fd.get('notes') as string
      };
      
      db.addExecution(newExec);
      refreshData();
      setShowExecutionModal(false);
  };

  const toggleExecutionStatus = (exec: ExecutionProcedure) => {
      const nextStatus = exec.status === 'pending' ? 'completed' : 'pending';
      db.updateExecution({ ...exec, status: nextStatus });
      refreshData();
  };

  const handleDeleteSession = (sessionId: string) => {
    if(confirm('حذف هذه الجلسة؟')) {
      db.deleteSession(sessionId);
      refreshData();
    }
  };

  const handleAddSession = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newSession: Session = {
        id: Date.now().toString(),
        caseId: caseData.id,
        sessionDate: fd.get('sessionDate') as string,
        sessionType: fd.get('sessionType') as string,
        judgeName: fd.get('judgeName') as string,
        notes: fd.get('notes') as string,
        status: SessionStatus.Upcoming
    };
    db.addSession(newSession);
    refreshData();
    setShowAddSessionModal(false);
  };

  const handleEditSessionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sessionToEdit) return;
    const fd = new FormData(e.currentTarget);
    const updated: Session = {
      ...sessionToEdit,
      sessionDate: fd.get('sessionDate') as string,
      sessionType: fd.get('sessionType') as string,
      judgeName: fd.get('judgeName') as string,
      notes: fd.get('notes') as string
    };
    db.updateSession(updated);
    setSessionToEdit(null);
    refreshData();
  };

  const handleMigrationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sessionToMigrate) return;
    const formData = new FormData(e.currentTarget);
    const notes = formData.get('notes') as string;
    const nextDate = formData.get('nextDate') as string;
    const nextType = formData.get('nextType') as string;
    const updatedOldSession: Session = { ...sessionToMigrate, notes: notes, status: SessionStatus.Completed };
    db.updateSession(updatedOldSession);
    if (nextDate) {
      const newSession: Session = {
        id: Date.now().toString(),
        caseId: caseData.id,
        sessionDate: nextDate,
        sessionType: nextType || 'جلسة عادية',
        notes: '',
        judgeName: sessionToMigrate.judgeName,
        status: SessionStatus.Upcoming
      };
      db.addSession(newSession);
    }
    refreshData();
    setSessionToMigrate(null);
  };

  const handleSmartExtract = async () => {
    if(!sessionToMigrate) return;
    const textarea = document.querySelector('textarea[name="notes"]') as HTMLTextAreaElement;
    const notes = textarea?.value;
    if (!notes || notes.trim().length < 5) {
        alert('يرجى كتابة تفاصيل ما تم في الجلسة أولاً.');
        return;
    }
    setIsExtractingTasks(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `حلل ملاحظات الجلسة: "${notes}" واستخرج المهام.`,
            config: {
                systemInstruction: "أرجع JSON: {summary: string, tasks: [{title, priority, dueDateOffset}]}",
                responseMimeType: "application/json"
            }
        });
        if (response.text) {
            const data = JSON.parse(response.text);
            if (data.summary && textarea) textarea.value = data.summary + "\n\n" + textarea.value;
            if (data.tasks && Array.isArray(data.tasks)) {
                data.tasks.forEach((t: any) => {
                    const dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + (t.dueDateOffset || 3));
                    db.addTask({
                        id: Date.now().toString() + Math.random(),
                        title: t.title,
                        assignee: "غير محدد",
                        priority: t.priority as TaskPriority,
                        dueDate: dueDate.toISOString().split('T')[0],
                        status: TaskStatus.Pending,
                        caseId: caseData.id
                    });
                });
            }
            refreshData();
        }
    } catch (e) {
        console.error(e);
        alert('خطأ في التحليل.');
    } finally {
        setIsExtractingTasks(false);
    }
  };

  const handleAddPayment = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const amount = Number(fd.get('amount'));
      db.addPayment({ id: Date.now().toString(), caseId: caseData.id, amount: amount, date: fd.get('date') as string, note: fd.get('note') as string });
      db.updateCase({ ...caseData, financialPaid: caseData.financialPaid + amount });
      refreshData();
      setShowPaymentModal(false);
  };

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      db.addExpense({ id: Date.now().toString(), caseId: caseData.id, amount: Number(fd.get('amount')), date: fd.get('date') as string, title: fd.get('title') as string, category: fd.get('category') as any });
      refreshData();
      setShowExpenseModal(false);
  };

  const handleDeletePayment = (paymentId: string, amount: number) => {
    if(confirm('حذف هذه الدفعة؟')) {
      db.deletePayment(paymentId);
      db.updateCase({ ...caseData, financialPaid: caseData.financialPaid - amount });
      refreshData();
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    if(confirm('حذف هذا المصروف؟')) {
      db.deleteExpense(expenseId);
      refreshData();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handleAddDocument = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const fileType = selectedFile ? (selectedFile.type.includes('image') ? 'image' : 'pdf') : 'other';
      db.addDocument({ id: Date.now().toString(), caseId: caseData.id, title: (fd.get('title') as string) || (selectedFile?.name ?? 'مستند جديد'), type: fileType, uploadDate: new Date().toISOString().split('T')[0] });
      refreshData();
      setShowDocModal(false);
      setSelectedFile(null);
  };

  const handleDeleteDocument = (id: string) => {
    if(confirm('حذف هذا المستند؟')) {
      db.deleteDocument(id);
      refreshData();
    }
  };

  const handleUpdateCase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const updatedCase: Case = {
        ...caseData,
        title: fd.get('title') as string,
        caseNumber: fd.get('caseNumber') as string,
        automaticNumber: fd.get('automaticNumber') as string,
        opponentName: fd.get('opponentName') as string,
        court: fd.get('court') as string,
        department: fd.get('department') as string,
    };
    db.updateCase(updatedCase);
    refreshData();
    setShowEditModal(false);
  };

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    db.addTask({ id: Date.now().toString(), title: fd.get('title') as string, assignee: fd.get('assignee') as string, priority: fd.get('priority') as TaskPriority, dueDate: fd.get('dueDate') as string, status: TaskStatus.Pending, caseId: caseData.id });
    refreshData();
    setShowTaskModal(false);
  };

  const toggleTask = (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if(task) {
          db.updateTask({ ...task, status: task.status === TaskStatus.Pending ? TaskStatus.Done : TaskStatus.Pending });
          refreshData();
      }
  };

  const handleDeleteTask = (taskId: string) => {
    if(confirm('حذف هذه المهمة؟')) {
      db.deleteTask(taskId);
      refreshData();
    }
  };

  const handleRegisterJudgment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const updated: Case = { ...caseData, status: CaseStatus.Closed, judgmentDate: fd.get('judgmentDate') as string, verdict: fd.get('verdict') as string };
    db.updateCase(updated);
    setCaseData(updated);
    setShowJudgmentModal(false);
  };

  const handleAnalyzeCase = async () => {
    setShowAIModal(true);
    if (aiAnalysis) return;
    setIsAnalysing(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `حلل القضية: ${caseData.title}، المحكمة: ${caseData.court}، الخصم: ${caseData.opponentName}. الجلسات: ${sessions.map(s => s.notes).join(' ')}.`;
        const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
        setAiAnalysis(response.text || "لم يتمكن النظام من تحليل القضية.");
    } catch (error) {
        setAiAnalysis("حدث خطأ.");
    } finally {
        setIsAnalysing(false);
    }
  };

  // Build Timeline Data
  const timelineEvents = [
    ...sessions.map(s => ({ id: s.id, date: s.sessionDate, type: 'session', title: s.sessionType, desc: s.notes || 'لا توجد ملاحظات', status: s.status })),
    ...documents.map(d => ({ id: d.id, date: d.uploadDate, type: 'document', title: 'تم رفع مستند', desc: d.title, status: '' })),
    ...payments.map(p => ({ id: p.id, date: p.date, type: 'payment', title: 'دفعة واردة', desc: `${p.amount.toLocaleString()} ${settings.currency}`, status: '' })),
    ...executions.map(e => ({ id: e.id, date: e.date, type: 'execution', title: e.type, desc: e.notes, status: e.status }))
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
        {/* Header */}
      <div className="flex items-center justify-between mb-4 no-print">
        <button onClick={() => navigate('/cases')} className="flex items-center text-gray-500 hover:text-slate-900">
            <ArrowRight size={16} className="ml-2" />
            عودة للقائمة
        </button>
        <button onClick={handlePrint} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <Printer size={18} />
            طباعة الملف
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 print:shadow-none print:border-black print:border-b-2 print:rounded-none">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-mono border print:border-black break-all">{caseData.caseNumber}</span>
                {caseData.automaticNumber && <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono border print:border-black break-all">آلي: {caseData.automaticNumber}</span>}
                <span className={`px-2 py-1 rounded text-xs font-semibold ${caseData.status === CaseStatus.Active ? 'bg-blue-100 text-blue-700' : caseData.status === CaseStatus.Execution ? 'bg-purple-100 text-purple-700' : caseData.status === CaseStatus.UnderFiling ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'} print:border print:border-black`}>
                    {caseData.status === CaseStatus.Active ? 'متداولة' : caseData.status === CaseStatus.Execution ? 'تنفيذ' : caseData.status === CaseStatus.UnderFiling ? 'تحت الرفع' : 'منتهية'}
                </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 break-words">{caseData.title}</h1>
            <p className="text-gray-500 mt-1 break-words">الخصم: {caseData.opponentName}</p>
          </div>
          
          <div className="flex flex-wrap gap-2 no-print">
            {caseData.status === CaseStatus.UnderFiling && (
                <button onClick={handleActivateCase} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 animate-pulse">
                    <PlayCircle size={18} /> تم رفع الدعوى
                </button>
            )}
            {/* Allow moving to execution from any status except execution */}
            {caseData.status !== CaseStatus.Execution && (
                <button onClick={handleMoveToExecution} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <ShieldAlert size={18} /> تحويل للتنفيذ
                </button>
            )}

            <button onClick={handleAnalyzeCase} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm" title="تحليل ذكي">
                <Sparkles size={18} /> تحليل ذكي
            </button>
            <button onClick={() => setShowEditModal(true)} className="bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2">
                <Edit2 size={18} /> تعديل
            </button>
            <button onClick={handleDeleteCase} className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-3 py-2 rounded-lg" title="حذف القضية">
                <Trash2 size={18} />
            </button>
            {caseData.status !== CaseStatus.Closed && caseData.status !== CaseStatus.Execution && (
                <button onClick={() => setShowJudgmentModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Gavel size={18} /> تسجيل حكم
                </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs - Hidden in Print */}
      <div className="flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto no-print">
        {['overview', 'sessions', 'execution', 'tasks', 'documents', 'financial'].map((tab) => (
            <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === tab ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                {tab === 'overview' && 'نظرة عامة'}
                {tab === 'sessions' && 'سجل الجلسات'}
                {tab === 'execution' && 'إجراءات التنفيذ'}
                {tab === 'tasks' && 'المهام'}
                {tab === 'documents' && 'المستندات'}
                {tab === 'financial' && 'المالية'}
            </button>
        ))}
      </div>

      {/* Interactive Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px] print:p-0 print:border-none print:shadow-none">
        
        {/* OVERVIEW TAB */}
        <div className={activeTab === 'overview' ? 'block' : 'hidden print:block'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2">بيانات القضية</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-gray-500">المحكمة</span>
                            <span className="font-medium break-words max-w-[60%] text-left">{caseData.court}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-gray-500">الدائرة</span>
                            <span className="font-medium break-words max-w-[60%] text-left">{caseData.department}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-gray-500">تاريخ الفتح</span>
                            <span className="font-medium">{caseData.openedDate}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-gray-500">الموكل</span>
                            <button onClick={() => navigate(`/clients/${caseData.clientId}`)} className="font-medium text-amber-600 hover:underline break-words">{client?.name}</button>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2 flex items-center gap-2">
                        <Activity size={18} /> آخر النشاطات
                    </h3>
                    <div className="space-y-0 relative border-r-2 border-slate-100 pr-4">
                        {timelineEvents.slice(0, 5).map((event, idx) => (
                            <div key={idx} className="relative mb-6 last:mb-0">
                                <div className={`absolute -right-[23px] top-0 w-3 h-3 rounded-full border-2 border-white 
                                    ${event.type === 'session' ? 'bg-amber-500' : event.type === 'execution' ? 'bg-purple-500' : event.type === 'payment' ? 'bg-green-500' : 'bg-blue-500'}`}>
                                </div>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 ml-2">
                                        <p className="font-bold text-sm text-slate-800 break-words">{event.title}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-wrap break-words">{event.desc}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full whitespace-nowrap">{event.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* EXECUTION TAB */}
        <div className={activeTab === 'execution' ? 'block' : 'hidden print:block'}>
             <div className="print:mt-8 print:pt-8 print:border-t">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <ShieldAlert className="text-purple-600" />
                        إجراءات التنفيذ
                    </h3>
                    <button onClick={() => setShowExecutionModal(true)} className="flex items-center gap-2 text-sm bg-purple-50 hover:bg-purple-100 text-purple-800 px-3 py-2 rounded-lg no-print">
                        <Plus size={16} /> إضافة إجراء
                    </button>
                </div>
                
                {caseData.status !== CaseStatus.Execution && (
                    <div className="bg-yellow-50 p-4 rounded-lg text-yellow-800 mb-4 flex gap-2">
                        <AlertTriangle size={20} />
                        <p>هذه القضية ليست في مرحلة التنفيذ حالياً. قم بتحويلها أولاً لإدارة الإجراءات بشكل صحيح.</p>
                    </div>
                )}

                <div className="space-y-4">
                    {executions.map((exec) => (
                        <div key={exec.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group">
                            <div className="flex items-center gap-4 flex-1">
                                <button onClick={() => toggleExecutionStatus(exec)} className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${exec.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-300'}`}>
                                    <CheckSquare size={16} />
                                </button>
                                <div>
                                    <h4 className={`font-bold ${exec.status === 'completed' ? 'text-gray-500 line-through' : 'text-slate-800'} break-words`}>{exec.type}</h4>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{exec.notes}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-mono text-gray-500">{exec.date}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded ${exec.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {exec.status === 'completed' ? 'تم التنفيذ' : 'قيد الإجراء'}
                                </span>
                            </div>
                        </div>
                    ))}
                    {executions.length === 0 && <p className="text-center text-gray-500 py-8">لا توجد إجراءات تنفيذ مسجلة.</p>}
                </div>
            </div>
        </div>

        {/* SESSIONS TAB */}
        <div className={activeTab === 'sessions' ? 'block' : 'hidden print:block'}>
             <div className="print:mt-8 print:pt-8 print:border-t">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800">تسلسل الجلسات</h3>
                    <button onClick={() => setShowAddSessionModal(true)} className="flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-lg no-print">
                        <Plus size={16} /> إضافة جلسة
                    </button>
                </div>
                <div className="space-y-6">
                    {sessions.map((session) => (
                        <div key={session.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active print:block">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 print:hidden">
                                {session.status === SessionStatus.Completed ? <CheckCircle className="text-green-500 w-5 h-5"/> : <AlertCircle className="text-amber-500 w-5 h-5"/>}
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded bg-white border border-gray-100 shadow-sm print:w-full print:mb-4 print:border-black">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-slate-900 break-words">{session.sessionType}</span>
                                    <time className="font-mono text-xs text-slate-500">{session.sessionDate}</time>
                                </div>
                                <div className="text-sm text-gray-600 mb-2 whitespace-pre-wrap break-words">{session.notes || 'لا توجد ملاحظات'}</div>
                                {session.status === SessionStatus.Upcoming && (
                                    <div className="flex gap-2 no-print">
                                        <button onClick={() => setSessionToMigrate(session)} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded">ترحيل الجلسة</button>
                                        <button onClick={() => setSessionToEdit(session)} className="text-gray-400 hover:text-blue-600"><Edit2 size={14}/></button>
                                        <button onClick={() => handleDeleteSession(session.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={14}/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {sessions.length === 0 && <p className="text-center text-gray-500">لا توجد جلسات.</p>}
                </div>
            </div>
        </div>

        {/* FINANCIAL TAB */}
        <div className={activeTab === 'financial' ? 'block' : 'hidden print:block'}>
             <div className="text-center py-6">
                <h3 className="text-2xl font-bold">{caseData.financialTotal.toLocaleString()} {settings.currency}</h3>
                <p className="text-gray-500">إجمالي العقد</p>
                <div className="mt-4 flex gap-4 justify-center no-print">
                    <button onClick={() => setShowPaymentModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded">تسجيل دفعة</button>
                    <button onClick={() => setShowExpenseModal(true)} className="bg-white border px-4 py-2 rounded">تسجيل مصروف</button>
                </div>
             </div>
             
             <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="font-bold text-green-700 mb-3 border-b pb-1">الدفعات الواردة</h4>
                    <ul className="space-y-2">
                        {payments.map(p => (
                            <li key={p.id} className="flex justify-between items-center bg-green-50 p-3 rounded">
                                <div>
                                    <span className="font-bold block">{p.amount.toLocaleString()}</span>
                                    <span className="text-xs text-gray-500 break-words">{p.date} - {p.note}</span>
                                </div>
                                <button onClick={() => handleDeletePayment(p.id, p.amount)} className="text-gray-400 hover:text-red-500 no-print"><Trash2 size={14}/></button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-red-700 mb-3 border-b pb-1">المصروفات</h4>
                    <ul className="space-y-2">
                        {expenses.map(e => (
                            <li key={e.id} className="flex justify-between items-center bg-red-50 p-3 rounded">
                                <div>
                                    <span className="font-bold block">{e.amount.toLocaleString()}</span>
                                    <span className="text-xs text-gray-500 break-words">{e.date} - {e.title}</span>
                                </div>
                                <button onClick={() => handleDeleteExpense(e.id)} className="text-gray-400 hover:text-red-500 no-print"><Trash2 size={14}/></button>
                            </li>
                        ))}
                    </ul>
                </div>
             </div>
        </div>

        {/* TASKS TAB */}
        <div className={activeTab === 'tasks' ? 'block' : 'hidden'}>
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-800">المهام</h3>
                <button onClick={() => setShowTaskModal(true)} className="bg-slate-100 px-3 py-2 rounded text-sm no-print"><Plus size={16}/> إضافة مهمة</button>
             </div>
             <div className="space-y-2">
                {tasks.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3 border rounded">
                        <div className="flex items-center gap-2">
                            <button onClick={() => toggleTask(t.id)}>{t.status === TaskStatus.Done ? <CheckSquare className="text-green-500"/> : <Square className="text-gray-300"/>}</button>
                            <span className={`${t.status === TaskStatus.Done ? 'line-through text-gray-400' : ''} break-words`}>{t.title}</span>
                        </div>
                        <button onClick={() => handleDeleteTask(t.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                ))}
             </div>
        </div>

        {/* DOCUMENTS TAB */}
        <div className={activeTab === 'documents' ? 'block' : 'hidden'}>
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-800">المستندات</h3>
                <button onClick={() => setShowDocModal(true)} className="bg-slate-100 px-3 py-2 rounded text-sm no-print"><Upload size={16}/> رفع مستند</button>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {documents.map(d => (
                    <div key={d.id} className="border p-4 rounded flex justify-between items-center">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="text-red-500 shrink-0"/>
                            <span className="truncate" title={d.title}>{d.title}</span>
                        </div>
                        <button onClick={() => handleDeleteDocument(d.id)} className="text-gray-300 hover:text-red-500 shrink-0"><Trash2 size={14}/></button>
                    </div>
                ))}
             </div>
        </div>

      </div>

      {/* Add Execution Modal */}
      {showExecutionModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-sm">
                  <div className="p-6 border-b">
                      <h2 className="text-xl font-bold">إضافة إجراء تنفيذ</h2>
                  </div>
                  <form onSubmit={handleAddExecution} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">نوع الإجراء</label>
                          <select name="type" className="w-full border rounded-lg p-2 bg-white">
                              <option value="قرار 34">قرار 34 (إبلاغ)</option>
                              <option value="قرار 46">قرار 46 (إيقاف خدمات)</option>
                              <option value="حبس">أمر حبس</option>
                              <option value="إفصاح">طلب إفصاح</option>
                              <option value="حجز">حجز على حسابات/عقارات</option>
                              <option value="بيع بالمزاد">بيع بالمزاد العلني</option>
                              <option value="أخرى">أخرى</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                          <input type="date" required name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border rounded-lg p-2" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                          <textarea name="notes" className="w-full border rounded-lg p-2"></textarea>
                      </div>
                      <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">حفظ الإجراء</button>
                      <button type="button" onClick={() => setShowExecutionModal(false)} className="w-full text-gray-500 py-2">إلغاء</button>
                  </form>
              </div>
          </div>
      )}

      {/* Migration Modal */}
      {sessionToMigrate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-lg">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">ترحيل الجلسة</h2>
                </div>
                <form onSubmit={handleMigrationSubmit} className="p-6 space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">القرار / ما تم</label>
                            <button type="button" onClick={handleSmartExtract} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
                                {isExtractingTasks ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} ذكاء اصطناعي
                            </button>
                        </div>
                        <textarea required name="notes" rows={4} className="w-full border rounded-lg p-2"></textarea>
                    </div>
                    <div className="border-t pt-4">
                        <p className="text-sm font-bold text-amber-600 mb-3">الجلسة القادمة</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                                <input type="date" name="nextDate" required className="w-full border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">نوع الجلسة</label>
                                <input name="nextType" className="w-full border rounded-lg p-2" />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button className="flex-1 bg-slate-900 text-white py-2 rounded-lg">حفظ وترحيل</button>
                        <button type="button" onClick={() => setSessionToMigrate(null)} className="px-6 py-2 border rounded-lg">إلغاء</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {sessionToEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-lg">
                <form onSubmit={handleEditSessionSubmit} className="p-6 space-y-4">
                    <h2 className="text-xl font-bold">تعديل الجلسة</h2>
                    <input type="date" name="sessionDate" defaultValue={sessionToEdit.sessionDate} className="w-full border rounded p-2" />
                    <input name="sessionType" defaultValue={sessionToEdit.sessionType} className="w-full border rounded p-2" />
                    <input name="judgeName" defaultValue={sessionToEdit.judgeName} className="w-full border rounded p-2" />
                    <textarea name="notes" defaultValue={sessionToEdit.notes} className="w-full border rounded p-2"></textarea>
                    <button className="w-full bg-slate-900 text-white py-2 rounded">تحديث</button>
                    <button type="button" onClick={() => setSessionToEdit(null)} className="w-full text-gray-500 mt-2">إلغاء</button>
                </form>
            </div>
        </div>
      )}
      {/* Add Session Modal */}
      {showAddSessionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-xl w-full max-w-lg">
                <form onSubmit={handleAddSession} className="p-6 space-y-4">
                    <h2 className="text-xl font-bold">جلسة جديدة</h2>
                    <input type="date" name="sessionDate" required className="w-full border rounded p-2" />
                    <input name="sessionType" required className="w-full border rounded p-2" placeholder="نوع الجلسة" />
                    <input name="judgeName" className="w-full border rounded p-2" placeholder="القاضي" />
                    <textarea name="notes" className="w-full border rounded p-2" placeholder="ملاحظات"></textarea>
                    <button className="w-full bg-slate-900 text-white py-2 rounded">إضافة</button>
                    <button type="button" onClick={() => setShowAddSessionModal(false)} className="w-full text-gray-500 mt-2">إلغاء</button>
                </form>
            </div>
        </div>
      )}
      {/* Edit Case Modal */}
      {showEditModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-2xl">
                  <form onSubmit={handleUpdateCase} className="p-6 space-y-4">
                      <h2 className="text-xl font-bold">تعديل القضية</h2>
                      <input name="title" defaultValue={caseData.title} className="w-full border rounded p-2" placeholder="العنوان"/>
                      <input name="caseNumber" defaultValue={caseData.caseNumber} className="w-full border rounded p-2" placeholder="رقم المكتب"/>
                      <input name="automaticNumber" defaultValue={caseData.automaticNumber} className="w-full border rounded p-2" placeholder="رقم آلي"/>
                      <input name="opponentName" defaultValue={caseData.opponentName} className="w-full border rounded p-2" placeholder="الخصم"/>
                      <input name="court" defaultValue={caseData.court} className="w-full border rounded p-2" placeholder="المحكمة"/>
                      <input name="department" defaultValue={caseData.department} className="w-full border rounded p-2" placeholder="الدائرة"/>
                      <button className="w-full bg-slate-900 text-white py-2 rounded">حفظ</button>
                      <button type="button" onClick={() => setShowEditModal(false)} className="w-full text-gray-500 mt-2">إلغاء</button>
                  </form>
              </div>
          </div>
      )}
      {/* Payment Modal */}
      {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl w-full max-w-sm">
                  <form onSubmit={handleAddPayment} className="p-6 space-y-4">
                      <h2 className="text-xl font-bold">دفعة جديدة</h2>
                      <input type="number" name="amount" required className="w-full border rounded p-2" placeholder="المبلغ"/>
                      <input type="date" name="date" required className="w-full border rounded p-2"/>
                      <input name="note" className="w-full border rounded p-2" placeholder="بيان"/>
                      <button className="w-full bg-slate-900 text-white py-2 rounded">حفظ</button>
                      <button type="button" onClick={() => setShowPaymentModal(false)} className="w-full text-gray-500 mt-2">إلغاء</button>
                  </form>
               </div>
          </div>
      )}
      {/* Expense Modal */}
      {showExpenseModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl w-full max-w-sm">
                  <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                      <h2 className="text-xl font-bold">مصروف جديد</h2>
                      <input type="number" name="amount" required className="w-full border rounded p-2" placeholder="المبلغ"/>
                      <input name="title" required className="w-full border rounded p-2" placeholder="السبب"/>
                      <select name="category" className="w-full border rounded p-2"><option value="other">أخرى</option><option value="court_fee">رسوم</option></select>
                      <input type="date" name="date" required className="w-full border rounded p-2"/>
                      <button className="w-full bg-red-600 text-white py-2 rounded">حفظ</button>
                      <button type="button" onClick={() => setShowExpenseModal(false)} className="w-full text-gray-500 mt-2">إلغاء</button>
                  </form>
               </div>
          </div>
      )}
      {/* Document Modal */}
      {showDocModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl w-full max-w-sm">
                  <form onSubmit={handleAddDocument} className="p-6 space-y-4">
                      <h2 className="text-xl font-bold">رفع مستند</h2>
                      <input type="file" onChange={handleFileChange} className="w-full"/>
                      <input name="title" placeholder="اسم المستند" className="w-full border rounded p-2"/>
                      <button className="w-full bg-slate-900 text-white py-2 rounded">حفظ</button>
                      <button type="button" onClick={() => setShowDocModal(false)} className="w-full text-gray-500 mt-2">إلغاء</button>
                  </form>
               </div>
          </div>
      )}
      {/* Task Modal */}
      {showTaskModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl w-full max-w-sm">
                  <form onSubmit={handleAddTask} className="p-6 space-y-4">
                      <h2 className="text-xl font-bold">مهمة جديدة</h2>
                      <input name="title" required className="w-full border rounded p-2" placeholder="العنوان"/>
                      <input name="assignee" className="w-full border rounded p-2" placeholder="المسؤول"/>
                      <input type="date" name="dueDate" required className="w-full border rounded p-2"/>
                      <select name="priority" className="w-full border rounded p-2"><option value="Medium">متوسط</option><option value="High">عاجل</option></select>
                      <button className="w-full bg-slate-900 text-white py-2 rounded">حفظ</button>
                      <button type="button" onClick={() => setShowTaskModal(false)} className="w-full text-gray-500 mt-2">إلغاء</button>
                  </form>
               </div>
          </div>
      )}
       {/* Judgment Modal */}
       {showJudgmentModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl w-full max-w-sm">
                  <form onSubmit={handleRegisterJudgment} className="p-6 space-y-4">
                      <h2 className="text-xl font-bold">تسجيل حكم</h2>
                      <input type="date" name="judgmentDate" required className="w-full border rounded p-2"/>
                      <textarea name="verdict" required className="w-full border rounded p-2" placeholder="منطوق الحكم"></textarea>
                      <button className="w-full bg-green-600 text-white py-2 rounded">حفظ</button>
                      <button type="button" onClick={() => setShowJudgmentModal(false)} className="w-full text-gray-500 mt-2">إلغاء</button>
                  </form>
               </div>
          </div>
      )}
      {/* AI Modal */}
      {showAIModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-auto p-6">
                    <h2 className="text-xl font-bold mb-4">تحليل ذكي</h2>
                    {isAnalysing ? <Loader2 className="animate-spin mx-auto"/> : <p className="whitespace-pre-wrap">{aiAnalysis}</p>}
                    <button onClick={() => setShowAIModal(false)} className="w-full bg-slate-200 mt-4 py-2 rounded">إغلاق</button>
               </div>
          </div>
      )}
    </div>
  );
};

export default CaseDetails;
