
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GoogleGenAI, Type } from "@google/genai";
import { db } from '../services/db';
import { Case, Session, SessionStatus, CaseStatus, CaseDocument, Task, TaskStatus, TaskPriority, Payment, CaseExpense, Client } from '../types';
import { Calendar, FileText, DollarSign, Gavel, CheckCircle, AlertCircle, ArrowRight, Download, Upload, Plus, Edit2, Timer, Printer, CheckSquare, Square, User, Trash2, X, AlertTriangle, TrendingDown, Clock, Activity, MessageCircle, Sparkles, Loader2, Bot } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'documents' | 'financial' | 'tasks'>('overview');
  
  // Modal State
  const [sessionToMigrate, setSessionToMigrate] = useState<Session | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showJudgmentModal, setShowJudgmentModal] = useState(false);
  
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

  const handleDeleteSession = (sessionId: string) => {
    if(confirm('حذف هذه الجلسة؟')) {
      db.deleteSession(sessionId);
      refreshData();
    }
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

    // 1. Update old session
    const updatedOldSession: Session = {
      ...sessionToMigrate,
      notes: notes,
      status: SessionStatus.Completed
    };
    db.updateSession(updatedOldSession);

    // 2. Create new session if date provided
    if (nextDate) {
      const newSession: Session = {
        id: Date.now().toString(),
        caseId: caseData.id,
        sessionDate: nextDate,
        sessionType: nextType || 'جلسة عادية',
        notes: '',
        judgeName: sessionToMigrate.judgeName, // Assume same judge usually
        status: SessionStatus.Upcoming
      };
      db.addSession(newSession);
    }

    refreshData();
    setSessionToMigrate(null);
  };

  const handleSmartExtract = async () => {
    if(!sessionToMigrate) return;
    // Get the current notes value from the textarea
    const textarea = document.querySelector('textarea[name="notes"]') as HTMLTextAreaElement;
    const notes = textarea?.value;

    if (!notes || notes.trim().length < 5) {
        alert('يرجى كتابة تفاصيل ما تم في الجلسة أولاً ليتمكن الذكاء الاصطناعي من تحليلها.');
        return;
    }

    setIsExtractingTasks(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `حلل ملاحظات جلسة المحكمة هذه واستخرج المهام المطلوبة للمحامي بشكل دقيق: "${notes}"`,
            config: {
                systemInstruction: "أنت مساعد قانوني. قم باستخراج المهام العملية من نص ملاحظات الجلسة. أرجع الناتج بصيغة JSON.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING, description: "ملخص احترافي للجلسة في جملة واحدة" },
                        tasks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING, description: "عنوان المهمة" },
                                    priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                                    dueDateOffset: { type: Type.NUMBER, description: "عدد الأيام المقترحة لتنفيذ المهمة من اليوم" }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (response.text) {
            const data = JSON.parse(response.text);
            
            // 1. Update Summary in Textarea
            if (data.summary && textarea) {
                textarea.value = data.summary + "\n\n" + textarea.value;
            }

            // 2. Create Tasks
            let tasksAdded = 0;
            if (data.tasks && Array.isArray(data.tasks)) {
                data.tasks.forEach((t: any) => {
                    const dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + (t.dueDateOffset || 3));
                    
                    const newTask: Task = {
                        id: Date.now().toString() + Math.random(),
                        title: t.title,
                        assignee: "غير محدد",
                        priority: t.priority as TaskPriority,
                        dueDate: dueDate.toISOString().split('T')[0],
                        status: TaskStatus.Pending,
                        caseId: caseData.id
                    };
                    db.addTask(newTask);
                    tasksAdded++;
                });
            }
            
            refreshData();
            alert(`✨ تم التحليل بنجاح!\n- تم تحسين صياغة الملاحظات.\n- تم إنشاء ${tasksAdded} مهام جديدة تلقائياً بناءً على ما تم في الجلسة.`);
        }
    } catch (e) {
        console.error(e);
        alert('حدث خطأ أثناء التحليل الذكي. تأكد من الاتصال بالإنترنت.');
    } finally {
        setIsExtractingTasks(false);
    }
  };

  const handleAddPayment = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const amount = Number(fd.get('amount'));
      
      const newPayment: Payment = {
        id: Date.now().toString(),
        caseId: caseData.id,
        amount: amount,
        date: fd.get('date') as string,
        note: fd.get('note') as string
      };
      
      db.addPayment(newPayment);

      // Update Case Total
      const updatedCase = {
          ...caseData,
          financialPaid: caseData.financialPaid + amount
      };
      db.updateCase(updatedCase);
      
      refreshData();
      setShowPaymentModal(false);
  };

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      
      const newExpense: CaseExpense = {
        id: Date.now().toString(),
        caseId: caseData.id,
        amount: Number(fd.get('amount')),
        date: fd.get('date') as string,
        title: fd.get('title') as string,
        category: fd.get('category') as any
      };
      
      db.addExpense(newExpense);
      refreshData();
      setShowExpenseModal(false);
  };

  const handleDeletePayment = (paymentId: string, amount: number) => {
    if(confirm('حذف هذه الدفعة؟')) {
      db.deletePayment(paymentId);
      const updatedCase = {
        ...caseData,
        financialPaid: caseData.financialPaid - amount
      };
      db.updateCase(updatedCase);
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
      if (e.target.files && e.target.files[0]) {
          setSelectedFile(e.target.files[0]);
      }
  };

  const handleAddDocument = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      
      const fileType = selectedFile ? (selectedFile.type.includes('image') ? 'image' : 'pdf') : 'other';
      
      const newDoc: CaseDocument = {
          id: Date.now().toString(),
          caseId: caseData.id,
          title: (fd.get('title') as string) || (selectedFile?.name ?? 'مستند جديد'),
          type: fileType, 
          uploadDate: new Date().toISOString().split('T')[0]
      };
      
      db.addDocument(newDoc);
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
    
    const newTask: Task = {
        id: Date.now().toString(),
        title: fd.get('title') as string,
        assignee: fd.get('assignee') as string,
        priority: fd.get('priority') as TaskPriority,
        dueDate: fd.get('dueDate') as string,
        status: TaskStatus.Pending,
        caseId: caseData.id
    };
    
    db.addTask(newTask);
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
    const updated: Case = { 
        ...caseData, 
        status: CaseStatus.Closed, 
        judgmentDate: fd.get('judgmentDate') as string,
        verdict: fd.get('verdict') as string 
    };
    db.updateCase(updated);
    setCaseData(updated);
    setShowJudgmentModal(false);
  };

  const sendSessionReminder = (session: Session) => {
      if (!client?.phone) {
          alert('لا يوجد رقم هاتف مسجل للموكل');
          return;
      }
      const message = `السلام عليكم. نذكركم بموعد جلسة في قضية رقم ${caseData.caseNumber} بتاريخ ${session.sessionDate} (${session.sessionType}). يرجى الحضور قبل الموعد بوقت كاف.`;
      const number = client.phone.replace(/[^0-9]/g, '');
      const waLink = `https://wa.me/966${number.startsWith('0') ? number.substring(1) : number}?text=${encodeURIComponent(message)}`;
      window.open(waLink, '_blank');
  };

  const getAppealDeadline = (judgmentDate: string) => {
      const date = new Date(judgmentDate);
      date.setDate(date.getDate() + 30); // 30 days appeal period
      return date.toISOString().split('T')[0];
  };

  const handleDownload = (docTitle: string) => {
    alert(`جاري تحميل المستند: ${docTitle}\n(محاكاة: في النسخة الحقيقية سيتم تنزيل الملف)`);
  };

  const handleAnalyzeCase = async () => {
    setShowAIModal(true);
    if (aiAnalysis) return; // Don't regenerate if already exists
    
    setIsAnalysing(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemInstruction = `أنت مستشار قانوني استراتيجي خبير في الأنظمة والقوانين المعمول بها في ${settings.country || 'المملكة العربية السعودية'}.`;
        
        const prompt = `
            قم بإجراء تحليل استراتيجي مفصل للقضية التالية وفقاً لقوانين ${settings.country}:
            
            بيانات القضية:
            - العنوان: ${caseData.title}
            - المحكمة: ${caseData.court}
            - الدائرة: ${caseData.department}
            - الخصم: ${caseData.opponentName}
            - الحالة: ${caseData.status}
            - تاريخ الفتح: ${caseData.openedDate}
            
            سجل الجلسات والملاحظات:
            ${sessions.map(s => `- ${s.sessionDate} (${s.sessionType}): ${s.notes || 'لا توجد ملاحظات'}`).join('\n')}

            المطلوب بدقة:
            1. **تقييم الموقف القانوني**: (قوي/متوسط/ضعيف) مع شرح الأسباب القانونية.
            2. **نقاط القوة والضعف**: استخرجها من وقائع الجلسات.
            3. **التوصيات الاستراتيجية**: 3 خطوات عملية يجب على المحامي اتخاذها الآن.
            4. **المخاطر المحتملة**: ماذا لو خسرنا القضية؟
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Using Pro model for complex reasoning
            contents: prompt,
            config: { systemInstruction }
        });

        setAiAnalysis(response.text || "لم يتمكن النظام من تحليل القضية.");
    } catch (error) {
        setAiAnalysis("حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة لاحقاً.");
        console.error(error);
    } finally {
        setIsAnalysing(false);
    }
  };

  // Build Timeline Data
  const timelineEvents = [
    ...sessions.map(s => ({ 
        id: s.id,
        date: s.sessionDate, 
        type: 'session', 
        title: s.sessionType, 
        desc: s.notes || 'لا توجد ملاحظات',
        status: s.status 
    })),
    ...documents.map(d => ({ 
        id: d.id,
        date: d.uploadDate, 
        type: 'document', 
        title: 'تم رفع مستند', 
        desc: d.title,
        status: '' 
    })),
    ...payments.map(p => ({ 
        id: p.id,
        date: p.date, 
        type: 'payment', 
        title: 'دفعة واردة', 
        desc: `${p.amount.toLocaleString()} ${settings.currency} - ${p.note}`,
        status: '' 
    }))
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
          <div>
            <div className="flex items-center gap-3 mb-2">
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-mono border print:border-black">{caseData.caseNumber}</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${caseData.status === CaseStatus.Active ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'} print:border print:border-black`}>
                    {caseData.status === CaseStatus.Active ? 'متداولة' : 'منتهية'}
                </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{caseData.title}</h1>
            <p className="text-gray-500 mt-1">الخصم: {caseData.opponentName}</p>
          </div>
          
          <div className="flex flex-wrap gap-2 no-print">
            <button 
                onClick={handleAnalyzeCase}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
                title="تحليل ذكي"
            >
                <Sparkles size={18} />
                تحليل ذكي (Pro)
            </button>
            <button 
                onClick={() => setShowEditModal(true)}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2"
            >
                <Edit2 size={18} />
                تعديل
            </button>
            <button 
                onClick={handleDeleteCase}
                className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-3 py-2 rounded-lg"
                title="حذف القضية"
            >
                <Trash2 size={18} />
            </button>
            {caseData.status !== CaseStatus.Closed && (
                <button 
                    onClick={() => setShowJudgmentModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Gavel size={18} />
                    تسجيل حكم
                </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs - Hidden in Print */}
      <div className="flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto no-print">
        {['overview', 'sessions', 'tasks', 'documents', 'financial'].map((tab) => (
            <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === tab ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                {tab === 'overview' && 'نظرة عامة'}
                {tab === 'sessions' && 'سجل الجلسات'}
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
                            <span className="font-medium">{caseData.court}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-gray-500">الدائرة</span>
                            <span className="font-medium">{caseData.department}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-gray-500">تاريخ الفتح</span>
                            <span className="font-medium">{caseData.openedDate}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="text-gray-500">الموكل</span>
                            <button onClick={() => navigate(`/clients/${caseData.clientId}`)} className="font-medium text-amber-600 hover:underline">{db.getClients().find(c => c.id === caseData.clientId)?.name}</button>
                        </div>
                    </div>
                    {caseData.verdict && (
                        <div className="mt-6 bg-slate-50 p-4 rounded-lg border border-slate-200 print:border-black">
                            <p className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                <Gavel size={18}/>
                                منطوق الحكم
                            </p>
                            <p className="text-gray-700 whitespace-pre-wrap">{caseData.verdict}</p>
                            <div className="mt-4 pt-4 border-t border-slate-200 text-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="text-gray-600">تاريخ الحكم:</span>
                                    <span className="font-bold">{caseData.judgmentDate}</span>
                                </div>
                                <div className="flex justify-between text-red-600">
                                    <span>نهاية الاستئناف:</span>
                                    <span className="font-bold">{caseData.judgmentDate ? getAppealDeadline(caseData.judgmentDate) : '-'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2 flex items-center gap-2">
                        <Activity size={18} />
                        آخر النشاطات (الخط الزمني)
                    </h3>
                    <div className="space-y-0 relative border-r-2 border-slate-100 pr-4">
                        {timelineEvents.slice(0, 5).map((event, idx) => (
                            <div key={idx} className="relative mb-6 last:mb-0">
                                <div className={`absolute -right-[23px] top-0 w-3 h-3 rounded-full border-2 border-white 
                                    ${event.type === 'session' ? 'bg-amber-500' : 
                                      event.type === 'payment' ? 'bg-green-500' : 'bg-blue-500'}`}>
                                </div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-sm text-slate-800">{event.title}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{event.desc}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{event.date}</span>
                                </div>
                            </div>
                        ))}
                        {timelineEvents.length === 0 && <p className="text-gray-400 text-sm">لا يوجد نشاط مسجل.</p>}
                        {timelineEvents.length > 5 && (
                             <button onClick={() => setActiveTab('sessions')} className="text-xs text-amber-600 mt-2 hover:underline">عرض كل النشاطات...</button>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* SESSIONS TAB */}
        <div className={activeTab === 'sessions' ? 'block' : 'hidden print:block'}>
             <div className="print:mt-8 print:pt-8 print:border-t">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800">تسلسل الجلسات</h3>
                </div>
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent print:before:hidden">
                    {sessions.map((session) => (
                        <div key={session.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active print:block">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 print:hidden">
                                {session.status === SessionStatus.Completed ? <CheckCircle className="text-green-500 w-5 h-5"/> : <AlertCircle className="text-amber-500 w-5 h-5"/>}
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded bg-white border border-gray-100 shadow-sm print:w-full print:mb-4 print:border-black print:break-inside-avoid">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-slate-900">{session.sessionType}</span>
                                    <div className="flex items-center gap-2">
                                        <time className="font-mono text-xs text-slate-500">{session.sessionDate}</time>
                                        {session.status === SessionStatus.Upcoming && (
                                            <div className="flex gap-1 no-print">
                                                <button onClick={() => sendSessionReminder(session)} className="text-green-500 hover:text-green-600" title="إرسال تذكير"><MessageCircle size={14}/></button>
                                                <button onClick={() => setSessionToEdit(session)} className="text-gray-400 hover:text-blue-600"><Edit2 size={14}/></button>
                                                <button onClick={() => handleDeleteSession(session.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={14}/></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 mb-2">
                                    {session.notes || 'لا توجد ملاحظات مسجلة بعد'}
                                </div>
                                {session.status === SessionStatus.Upcoming && (
                                    <button 
                                        onClick={() => setSessionToMigrate(session)}
                                        className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-800 w-full md:w-auto no-print"
                                    >
                                        ترحيل الجلسة (إضافة ما تم)
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {sessions.length === 0 && <p className="text-center text-gray-500">لا توجد جلسات مسجلة.</p>}
                </div>
            </div>
        </div>

        {/* FINANCIAL TAB */}
        <div className={activeTab === 'financial' ? 'block' : 'hidden print:block'}>
            <div className="print:mt-8 print:pt-8 print:border-t">
                <h3 className="font-bold text-lg text-slate-800 mb-4 text-center print:text-right">الملخص المالي</h3>
                <div className="max-w-4xl mx-auto py-6 print:max-w-full print:py-4">
                    <div className="text-center mb-8">
                        <h3 className="text-3xl font-bold text-slate-900 mb-2">{caseData.financialTotal.toLocaleString()} <span className="text-sm font-normal text-gray-500">{settings.currency}</span></h3>
                        <p className="text-gray-500 mb-6 print:mb-4">إجمالي قيمة العقد</p>
                        
                        <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-6 mb-6 print:bg-white print:border print:border-black">
                            <div>
                                <span className="block text-gray-500 text-sm mb-1">المدفوع من العميل</span>
                                <span className="font-bold text-green-600 text-xl">{caseData.financialPaid.toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-sm mb-1">المصروفات</span>
                                <span className="font-bold text-red-500 text-xl">{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span>
                            </div>
                            <div className="border-r border-gray-200 pr-4">
                                <span className="block text-gray-500 text-sm mb-1">صافي للمكتب</span>
                                <span className={`font-bold text-xl ${(caseData.financialPaid - expenses.reduce((sum, e) => sum + e.amount, 0)) >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                                    {(caseData.financialPaid - expenses.reduce((sum, e) => sum + e.amount, 0)).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 justify-center no-print">
                            <button 
                                onClick={() => setShowPaymentModal(true)}
                                className="bg-slate-900 text-white py-2 px-6 rounded-lg hover:bg-slate-800 flex items-center gap-2"
                            >
                                <Plus size={18} />
                                تسجيل دفعة
                            </button>
                            <button 
                                onClick={() => setShowExpenseModal(true)}
                                className="bg-white border border-gray-300 text-slate-700 py-2 px-6 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                            >
                                <TrendingDown size={18} />
                                تسجيل مصروف
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Payments Table */}
                        <div>
                            <h4 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                                <DollarSign size={18} className="text-green-600" />
                                سجل الدفعات (الوارد)
                            </h4>
                            <div className="bg-white border rounded-lg overflow-hidden print:border-black">
                                <table className="w-full text-right">
                                    <thead className="bg-green-50 print:bg-gray-200">
                                        <tr>
                                            <th className="p-3 text-sm font-medium text-gray-600">التاريخ</th>
                                            <th className="p-3 text-sm font-medium text-gray-600">المبلغ</th>
                                            <th className="p-3 text-sm font-medium text-gray-600">البيان</th>
                                            <th className="p-3 no-print"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {payments.map(payment => (
                                            <tr key={payment.id} className="group hover:bg-gray-50">
                                                <td className="p-3 text-sm">{payment.date}</td>
                                                <td className="p-3 font-bold text-green-600">{payment.amount.toLocaleString()}</td>
                                                <td className="p-3 text-sm text-gray-600 truncate max-w-[100px]" title={payment.note}>{payment.note}</td>
                                                <td className="p-3 text-left no-print">
                                                    <button 
                                                        onClick={() => handleDeletePayment(payment.id, payment.amount)}
                                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {payments.length === 0 && (
                                            <tr><td colSpan={4} className="p-4 text-center text-gray-400 text-sm">لا توجد دفعات.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Expenses Table */}
                        <div>
                            <h4 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                                <TrendingDown size={18} className="text-red-600" />
                                سجل المصروفات (الصادر)
                            </h4>
                            <div className="bg-white border rounded-lg overflow-hidden print:border-black">
                                <table className="w-full text-right">
                                    <thead className="bg-red-50 print:bg-gray-200">
                                        <tr>
                                            <th className="p-3 text-sm font-medium text-gray-600">التاريخ</th>
                                            <th className="p-3 text-sm font-medium text-gray-600">المبلغ</th>
                                            <th className="p-3 text-sm font-medium text-gray-600">السبب</th>
                                            <th className="p-3 no-print"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {expenses.map(expense => (
                                            <tr key={expense.id} className="group hover:bg-gray-50">
                                                <td className="p-3 text-sm">{expense.date}</td>
                                                <td className="p-3 font-bold text-red-600">{expense.amount.toLocaleString()}</td>
                                                <td className="p-3 text-sm text-gray-600 truncate max-w-[100px]" title={expense.title}>{expense.title}</td>
                                                <td className="p-3 text-left no-print">
                                                    <button 
                                                        onClick={() => handleDeleteExpense(expense.id)}
                                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {expenses.length === 0 && (
                                            <tr><td colSpan={4} className="p-4 text-center text-gray-400 text-sm">لا توجد مصروفات.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* TASKS TAB - Hidden in Print */}
        <div className={activeTab === 'tasks' ? 'block' : 'hidden'}>
             <div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800">المهام المرتبطة بالقضية</h3>
                    <button onClick={() => setShowTaskModal(true)} className="flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-lg no-print">
                        <Plus size={16} />
                        إضافة مهمة
                    </button>
                </div>
                <div className="space-y-2">
                    {tasks.map(task => (
                         <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors group">
                             <div className="flex items-center gap-3">
                                 <button onClick={() => toggleTask(task.id)} className={task.status === TaskStatus.Done ? 'text-green-500' : 'text-gray-300'}>
                                     {task.status === TaskStatus.Done ? <CheckSquare size={20} /> : <Square size={20} />}
                                 </button>
                                 <span className={task.status === TaskStatus.Done ? 'line-through text-gray-400' : 'text-slate-800'}>{task.title}</span>
                             </div>
                             <div className="flex items-center gap-4 text-xs text-gray-500">
                                 <span className={`px-2 py-0.5 rounded ${task.priority === TaskPriority.High ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                     {task.priority === TaskPriority.High ? 'عاجل' : 'عادي'}
                                 </span>
                                 <span className="flex items-center gap-1"><User size={12}/> {task.assignee}</span>
                                 <span>{task.dueDate}</span>
                                 <button onClick={() => handleDeleteTask(task.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                             </div>
                         </div>
                    ))}
                    {tasks.length === 0 && (
                        <div className="py-10 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                            لا توجد مهام مسجلة لهذه القضية.
                        </div>
                    )}
                </div>
             </div>
        </div>

        {/* DOCUMENTS TAB - Hidden in Print */}
        <div className={activeTab === 'documents' ? 'block' : 'hidden'}>
             <div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800">المستندات والمرفقات</h3>
                    <button onClick={() => setShowDocModal(true)} className="flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-lg no-print">
                        <Upload size={16} />
                        رفع مستند
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                        <div key={doc.id} className="border border-gray-200 p-4 rounded-lg flex items-center justify-between hover:shadow-md transition-shadow group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900 text-sm">{doc.title}</p>
                                    <p className="text-xs text-gray-500">{doc.uploadDate}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => handleDownload(doc.title)} className="text-gray-400 hover:text-slate-900">
                                    <Download size={18} />
                                </button>
                                <button onClick={() => handleDeleteDocument(doc.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {documents.length === 0 && (
                        <div className="col-span-full py-10 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                            لا توجد مستندات مرفقة.
                        </div>
                    )}
                </div>
             </div>
        </div>
      </div>

      {/* Migration Modal */}
      {sessionToMigrate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-lg">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">ترحيل الجلسة</h2>
                    <p className="text-sm text-gray-500 mt-1">تحديث جلسة {sessionToMigrate.sessionDate}</p>
                </div>
                <form onSubmit={handleMigrationSubmit} className="p-6 space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">ماذا تم في الجلسة؟ (القرار)</label>
                            <button 
                                type="button" 
                                onClick={handleSmartExtract}
                                disabled={isExtractingTasks}
                                className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-amber-200 transition-colors"
                            >
                                {isExtractingTasks ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                                استخراج المهام وتلخيص
                            </button>
                        </div>
                        <textarea required name="notes" rows={4} className="w-full border rounded-lg p-2" placeholder="اكتب تفاصيل ما حدث في الجلسة، ثم اضغط على زر الاستخراج الذكي لتحويل الملاحظات إلى مهام..."></textarea>
                    </div>
                    
                    <div className="border-t pt-4">
                        <p className="text-sm font-bold text-amber-600 mb-3">تفاصيل الجلسة القادمة</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ القادم</label>
                                <input type="date" name="nextDate" required className="w-full border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">نوع الجلسة</label>
                                <input name="nextType" placeholder="مثال: مرافعة" className="w-full border rounded-lg p-2" />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button type="submit" className="flex-1 bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800">حفظ وترحيل</button>
                        <button type="button" onClick={() => setSessionToMigrate(null)} className="px-6 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {sessionToEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-lg">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">تعديل الجلسة</h2>
                    <button onClick={() => setSessionToEdit(null)}><X className="text-gray-400" /></button>
                </div>
                <form onSubmit={handleEditSessionSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الجلسة</label>
                            <input type="date" name="sessionDate" defaultValue={sessionToEdit.sessionDate} required className="w-full border rounded-lg p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">نوع الجلسة</label>
                            <input name="sessionType" defaultValue={sessionToEdit.sessionType} className="w-full border rounded-lg p-2" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">القاضي</label>
                        <input name="judgeName" defaultValue={sessionToEdit.judgeName} className="w-full border rounded-lg p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                        <textarea name="notes" defaultValue={sessionToEdit.notes} rows={2} className="w-full border rounded-lg p-2"></textarea>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button type="submit" className="flex-1 bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800">تحديث</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Edit Case Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl">
            <div className="p-6 border-b">
                <h2 className="text-xl font-bold">تعديل بيانات القضية</h2>
            </div>
            <form onSubmit={handleUpdateCase} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">موضوع الدعوى</label>
                    <input required name="title" defaultValue={caseData.title} className="w-full border rounded-lg p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رقم القضية</label>
                    <input required name="caseNumber" defaultValue={caseData.caseNumber} className="w-full border rounded-lg p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم الخصم</label>
                    <input required name="opponentName" defaultValue={caseData.opponentName} className="w-full border rounded-lg p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المحكمة</label>
                    <input required name="court" defaultValue={caseData.court} className="w-full border rounded-lg p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الدائرة</label>
                    <input name="department" defaultValue={caseData.department} className="w-full border rounded-lg p-2" />
                </div>
                <div className="md:col-span-2 mt-4 flex gap-3">
                    <button className="flex-1 bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800">حفظ التغييرات</button>
                    <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Judgment Modal */}
      {showJudgmentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-lg">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Gavel size={24} className="text-green-600" />
                        تسجيل حكم نهائي
                    </h2>
                </div>
                <form onSubmit={handleRegisterJudgment} className="p-6 space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex gap-2">
                        <AlertTriangle className="text-yellow-600 shrink-0" size={20} />
                        <p className="text-sm text-yellow-800">تحذير: تسجيل الحكم سيقوم بإغلاق القضية وتغيير حالتها إلى "منتهية" وبدء احتساب مهلة الاستئناف.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الحكم</label>
                        <input type="date" required name="judgmentDate" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border rounded-lg p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">منطوق الحكم</label>
                        <textarea required name="verdict" rows={5} className="w-full border rounded-lg p-2" placeholder="حكمت المحكمة بـ..."></textarea>
                    </div>
                    <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-bold">حفظ وإغلاق القضية</button>
                    <button type="button" onClick={() => setShowJudgmentModal(false)} className="w-full text-gray-500 py-2">إلغاء</button>
                </form>
            </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-sm">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">تسجيل دفعة واردة</h2>
                </div>
                <form onSubmit={handleAddPayment} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ ({settings.currency})</label>
                        <input type="number" required name="amount" className="w-full border rounded-lg p-2 text-lg font-bold" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                        <input type="date" required name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border rounded-lg p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات / البيان</label>
                        <input name="note" className="w-full border rounded-lg p-2" placeholder="مثال: دفعة تحت الحساب" />
                    </div>
                    <button className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800">حفظ الدفعة</button>
                    <button type="button" onClick={() => setShowPaymentModal(false)} className="w-full text-gray-500 py-2">إلغاء</button>
                </form>
            </div>
        </div>
      )}

       {/* Expense Modal */}
       {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-sm">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-red-600">تسجيل مصروف (صادر)</h2>
                </div>
                <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ ({settings.currency})</label>
                        <input type="number" required name="amount" className="w-full border rounded-lg p-2 text-lg font-bold" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">السبب</label>
                        <input required name="title" className="w-full border rounded-lg p-2" placeholder="مثال: رسوم صحيفة دعوى" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                        <select name="category" className="w-full border rounded-lg p-2 bg-white">
                             <option value="court_fee">رسوم قضائية</option>
                             <option value="expert">أتعاب خبراء</option>
                             <option value="transport">نقل وانتقال</option>
                             <option value="other">أخرى</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                        <input type="date" required name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border rounded-lg p-2" />
                    </div>
                    <button className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">حفظ المصروف</button>
                    <button type="button" onClick={() => setShowExpenseModal(false)} className="w-full text-gray-500 py-2">إلغاء</button>
                </form>
            </div>
        </div>
      )}

       {/* Document Modal */}
       {showDocModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-sm">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">إضافة مستند</h2>
                </div>
                <form onSubmit={handleAddDocument} className="p-6 space-y-4">
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">اختيار ملف</label>
                         <input 
                            type="file" 
                            onChange={handleFileChange}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                         />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستند (اختياري)</label>
                        <input name="title" defaultValue={selectedFile?.name} className="w-full border rounded-lg p-2" placeholder="اتركه فارغاً لاستخدام اسم الملف" />
                    </div>
                    <button className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800" disabled={!selectedFile}>حفظ</button>
                    <button type="button" onClick={() => setShowDocModal(false)} className="w-full text-gray-500 py-2">إلغاء</button>
                </form>
            </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">إضافة مهمة للقضية</h2>
                </div>
                <form onSubmit={handleAddTask} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">عنوان المهمة</label>
                        <input required name="title" className="w-full border rounded-lg p-2" placeholder="مثال: سداد رسم الاستئناف" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">المسؤول</label>
                            <input name="assignee" className="w-full border rounded-lg p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الاستحقاق</label>
                            <input required type="date" name="dueDate" className="w-full border rounded-lg p-2" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">الأولوية</label>
                        <select name="priority" className="w-full border rounded-lg p-2">
                             <option value={TaskPriority.Medium}>متوسطة</option>
                             <option value={TaskPriority.High}>عاجلة</option>
                             <option value={TaskPriority.Low}>منخفضة</option>
                        </select>
                    </div>
                    <button className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800">حفظ المهمة</button>
                    <button type="button" onClick={() => setShowTaskModal(false)} className="w-full text-gray-500 py-2">إلغاء</button>
                </form>
            </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                <div className="flex items-center gap-2">
                    <Bot className="text-amber-500" size={24} />
                    <h2 className="text-xl font-bold text-slate-800">تحليل الذكاء الاصطناعي للقضية</h2>
                </div>
                <button onClick={() => setShowAIModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1">
                {isAnalysing ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 size={48} className="text-amber-500 animate-spin" />
                        <p className="text-lg font-medium text-slate-600">جاري تحليل بيانات القضية وتوليد التوصيات...</p>
                        <p className="text-sm text-gray-400">يتم مراجعة الوقائع، الخصوم، وتاريخ الجلسات وفقاً لقوانين {settings.country}.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="prose prose-sm max-w-none text-right">
                             <div className="whitespace-pre-wrap leading-relaxed text-slate-700 bg-amber-50/50 p-6 rounded-xl border border-amber-100">
                                {aiAnalysis}
                             </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t gap-3">
                            <button onClick={() => handleAnalyzeCase()} className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1">
                                <Sparkles size={14} />
                                إعادة التحليل
                            </button>
                            <button onClick={() => setShowAIModal(false)} className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800">إغلاق</button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetails;