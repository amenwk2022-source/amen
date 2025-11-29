
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { db } from '../services/db';
import { Client, Case, ClientType, Consultation } from '../types';
import { ArrowRight, User, Building, Phone, Mail, MapPin, Briefcase, Edit2, Trash2, Wallet, CheckCircle, Printer, MessageCircle, MessageSquare, Sparkles, Loader2, X } from 'lucide-react';

const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [clientCases, setClientCases] = useState<Case[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const settings = db.getSettings();

  // AI Analysis State
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (id) {
      const c = db.getClients().find(c => c.id === id);
      if (c) {
        setClient(c);
        setClientCases(db.getCases().filter(ca => ca.clientId === id));
        setConsultations(db.getConsultations().filter(co => co.clientId === id));
      }
    }
  }, [id]);

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!client) return;

    const fd = new FormData(e.currentTarget);
    const updatedClient: Client = {
      ...client,
      name: fd.get('name') as string,
      type: fd.get('type') as ClientType,
      phone: fd.get('phone') as string,
      email: fd.get('email') as string,
      address: fd.get('address') as string,
    };

    db.updateClient(updatedClient);
    setClient(updatedClient);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if(confirm('هل أنت متأكد من حذف هذا الموكل؟ سيتم حذف الموكل من السجل.')) {
        if(client) {
            db.deleteClient(client.id);
            navigate('/clients');
        }
    }
  };

  const handlePrint = () => {
      window.print();
  };

  const openWhatsApp = () => {
      if (client?.phone) {
          const number = client.phone.replace(/[^0-9]/g, '');
          window.open(`https://wa.me/966${number.startsWith('0') ? number.substring(1) : number}`, '_blank');
      }
  };

  const handleAnalyzeClient = async () => {
      setShowAnalysis(true);
      if (analysisResult) return;
      
      setIsAnalyzing(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          const totalContracts = clientCases.reduce((sum, c) => sum + c.financialTotal, 0);
          const totalPaid = clientCases.reduce((sum, c) => sum + c.financialPaid, 0);
          
          const prompt = `
            حلل ملف هذا الموكل القانوني وأعط تقريراً موجزاً:
            الاسم: ${client?.name}
            النوع: ${client?.type}
            عدد القضايا: ${clientCases.length}
            حالة القضايا: ${clientCases.map(c => c.status).join(', ')}
            إجمالي العقود: ${totalContracts}
            إجمالي المدفوع: ${totalPaid}
            نسبة السداد: ${totalContracts > 0 ? Math.round((totalPaid / totalContracts) * 100) : 0}%
            
            المطلوب:
            1. تقييم الموكل (VIP/جيد/متعثر)
            2. المخاطر المالية
            3. توصية للتعامل معه مستقبلاً
          `;
          
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt
          });
          
          setAnalysisResult(response.text || 'تعذر التحليل');
      } catch (e) {
          setAnalysisResult('حدث خطأ أثناء الاتصال بالذكاء الاصطناعي');
      } finally {
          setIsAnalyzing(false);
      }
  };

  if (!client) return <div className="p-8 text-center">جاري التحميل...</div>;

  // Financial Calculations
  const totalContracts = clientCases.reduce((sum, c) => sum + c.financialTotal, 0);
  const totalPaid = clientCases.reduce((sum, c) => sum + c.financialPaid, 0);
  const totalConsultations = consultations.reduce((sum, c) => sum + c.price, 0);
  const totalConsultationsPaid = consultations.filter(c => c.isPaid).reduce((sum, c) => sum + c.price, 0);
  
  const totalDue = (totalContracts + totalConsultations) - (totalPaid + totalConsultationsPaid);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 no-print">
        <button onClick={() => navigate('/clients')} className="flex items-center text-gray-500 hover:text-slate-900">
            <ArrowRight size={16} className="ml-2" />
            عودة لقائمة الموكلين
        </button>
        <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800">
            <Printer size={18} />
            طباعة كشف حساب
        </button>
      </div>

      <div className="print-sheet max-w-4xl mx-auto">
        {/* Print Header */}
        <div className="hidden print:block text-center border-b-2 border-black pb-6 mb-8">
            <h3 className="text-sm mb-2">{settings.printHeader}</h3>
            <h1 className="text-2xl font-bold mb-2">{settings.officeName}</h1>
            <h2 className="text-xl font-bold underline">ملف موكل / كشف حساب</h2>
            <p className="text-gray-500 mt-2">تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</p>
        </div>

        {/* Client Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8 relative group print:shadow-none print:border print:border-black">
            <div className="absolute top-4 left-4 flex gap-2 no-print">
                <button 
                  onClick={handleAnalyzeClient}
                  className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-full transition-colors shadow-lg"
                  title="تحليل ذكي للموكل"
                >
                  <Sparkles size={18} />
                </button>
                <button 
                  onClick={openWhatsApp}
                  className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors"
                  title="مراسلة واتساب"
                >
                  <MessageCircle size={18} />
                </button>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                  title="تعديل"
                >
                <Edit2 size={18} />
                </button>
                <button 
                  onClick={handleDelete}
                  className="bg-white/20 hover:bg-red-500/50 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                  title="حذف"
                >
                <Trash2 size={18} />
                </button>
            </div>

            <div className="bg-slate-900 p-6 flex flex-col md:flex-row items-center gap-6 print:bg-white print:text-black print:border-b print:border-black">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 border-slate-800 print:border-black ${client.type === ClientType.Company ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                {client.type === ClientType.Company ? <Building size={32}/> : <User size={32}/>}
                </div>
                <div className="text-center md:text-right">
                    <h1 className="text-2xl font-bold text-white print:text-black mb-1">{client.name}</h1>
                    <p className="text-slate-400 print:text-gray-600">{client.type === ClientType.Company ? 'شركة / مؤسسة' : 'فرد'}</p>
                </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
                <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="text-slate-400 print:text-black" size={20} />
                    <span className="font-medium text-slate-800 break-words">{client.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="text-slate-400 print:text-black" size={20} />
                    <span className="font-medium text-slate-800 break-words">{client.email || 'لا يوجد بريد إلكتروني'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                    <MapPin className="text-slate-400 print:text-black" size={20} />
                    <span className="font-medium text-slate-800 break-words">{client.address || 'لا يوجد عنوان مسجل'}</span>
                </div>
            </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 print:grid-cols-3">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between print:border-black">
                <div>
                    <p className="text-gray-500 text-sm mb-1">إجمالي العقود + الاستشارات</p>
                    <p className="text-2xl font-bold text-slate-800">{(totalContracts + totalConsultations).toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 print:hidden">
                    <Briefcase size={20} />
                </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between print:border-black">
                <div>
                    <p className="text-gray-500 text-sm mb-1">إجمالي المدفوع</p>
                    <p className="text-2xl font-bold text-green-600 print:text-black">{(totalPaid + totalConsultationsPaid).toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 print:hidden">
                    <CheckCircle size={20} />
                </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between print:border-black">
                <div>
                    <p className="text-gray-500 text-sm mb-1">المتبقي (مستحقات)</p>
                    <p className={`text-2xl font-bold ${totalDue > 0 ? 'text-amber-600' : 'text-gray-400'} print:text-black`}>{totalDue.toLocaleString()}</p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${totalDue > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'} print:hidden`}>
                    <Wallet size={20} />
                </div>
            </div>
        </div>

        {/* Linked Cases */}
        <div className="flex items-center gap-2 mb-6">
            <Briefcase className="text-slate-900" />
            <h2 className="text-xl font-bold text-slate-900">القضايا المرتبطة</h2>
            <span className="bg-slate-100 px-2 rounded-full text-sm font-bold text-slate-600 print:border print:border-black">{clientCases.length}</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:border-black mb-8">
            {clientCases.length > 0 ? (
            <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-gray-200 print:bg-gray-200 print:text-black">
                    <tr>
                        <th className="p-4">رقم القضية</th>
                        <th className="p-4">العنوان</th>
                        <th className="p-4">الخصم</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4 print:w-24">المالية</th>
                        <th className="p-4 no-print"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 print:divide-black">
                    {clientCases.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50">
                            <td className="p-4 font-bold text-slate-800 break-words">{c.caseNumber}</td>
                            <td className="p-4 break-words">{c.title}</td>
                            <td className="p-4 text-gray-500 break-words">{c.opponentName}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${c.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'} print:border print:border-black`}>
                                    {c.status}
                                </span>
                            </td>
                            <td className="p-4 text-xs">
                                <div className="flex flex-col">
                                    <span>عقد: {c.financialTotal.toLocaleString()}</span>
                                    <span className="text-green-600">دفع: {c.financialPaid.toLocaleString()}</span>
                                </div>
                            </td>
                            <td className="p-4 no-print">
                                <Link to={`/cases/${c.id}`} className="text-amber-600 hover:text-amber-700 text-sm font-medium">عرض</Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            ) : (
                <div className="p-10 text-center text-gray-500">
                    لا توجد قضايا مسجلة لهذا الموكل.
                </div>
            )}
        </div>

        {/* Consultations */}
        {consultations.length > 0 && (
            <>
                <div className="flex items-center gap-2 mb-6">
                    <MessageSquare className="text-slate-900" />
                    <h2 className="text-xl font-bold text-slate-900">سجل الاستشارات</h2>
                    <span className="bg-slate-100 px-2 rounded-full text-sm font-bold text-slate-600 print:border print:border-black">{consultations.length}</span>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:border-black">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-gray-200 print:bg-gray-200 print:text-black">
                            <tr>
                                <th className="p-4">التاريخ</th>
                                <th className="p-4">الموضوع</th>
                                <th className="p-4">المبلغ</th>
                                <th className="p-4">حالة السداد</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 print:divide-black">
                            {consultations.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-bold text-slate-800">{c.date}</td>
                                    <td className="p-4 break-words">{c.topic}</td>
                                    <td className="p-4 text-slate-800">{c.price.toLocaleString()}</td>
                                    <td className="p-4">
                                        {c.isPaid ? 
                                            <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={14}/> مدفوع</span> : 
                                            <span className="text-red-500 font-bold">غير مدفوع</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </>
        )}
        
        <div className="mt-12 pt-8 border-t border-black flex justify-between text-sm print-only">
            <span>توقيع العميل بالتصادق على الرصيد: ............................</span>
            <div className="text-left">
                <p className="font-bold">{settings.lawyerName}</p>
                <p>{settings.printFooter}</p>
            </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <h2 className="p-6 border-b text-xl font-bold">تعديل بيانات الموكل</h2>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                 <input required name="name" defaultValue={client.name} className="w-full border rounded p-2" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                 <select name="type" defaultValue={client.type} className="w-full border rounded p-2 bg-white">
                    <option value={ClientType.Individual}>فرد</option>
                    <option value={ClientType.Company}>شركة</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
                 <input required name="phone" defaultValue={client.phone} className="w-full border rounded p-2" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                 <input name="email" defaultValue={client.email} className="w-full border rounded p-2" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                 <textarea name="address" defaultValue={client.address} className="w-full border rounded p-2"></textarea>
              </div>
              <button className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800">حفظ التغييرات</button>
              <button type="button" onClick={() => setIsEditing(false)} className="w-full border py-2 rounded hover:bg-gray-50">إلغاء</button>
            </form>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysis && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg relative">
            <button 
                onClick={() => setShowAnalysis(false)} 
                className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"
            >
                <X size={20} />
            </button>
            <div className="p-6 border-b bg-slate-50 rounded-t-xl flex items-center gap-2">
                <Sparkles className="text-amber-500" />
                <h2 className="text-xl font-bold text-slate-800">تحليل الموكل الذكي</h2>
            </div>
            <div className="p-6">
                {isAnalyzing ? (
                    <div className="text-center py-8">
                        <Loader2 className="animate-spin text-amber-500 w-10 h-10 mx-auto mb-3" />
                        <p className="text-gray-500">جاري تحليل البيانات المالية والقضائية للموكل...</p>
                    </div>
                ) : (
                    <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed bg-amber-50/50 p-4 rounded-lg border border-amber-100">
                            {analysisResult}
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

export default ClientDetails;
