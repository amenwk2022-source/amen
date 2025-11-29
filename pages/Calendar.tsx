
import React, { useState, useRef } from 'react';
import { db } from '../services/db';
import { Printer, ChevronLeft, ChevronRight, Share2, Download, Gavel } from 'lucide-react';

const CalendarPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const sheetRef = useRef<HTMLDivElement>(null);
  
  const sessions = db.getSessions().filter(s => s.sessionDate === selectedDate);
  const cases = db.getCases();
  const settings = db.getSettings();

  const handlePrint = () => {
    window.print();
  };

  const handleShareImage = async () => {
    if (sheetRef.current && (window as any).html2canvas) {
      try {
        const canvas = await (window as any).html2canvas(sheetRef.current, {
           scale: 2, // Higher resolution
           useCORS: true,
           backgroundColor: '#ffffff'
        });
        
        const image = canvas.toDataURL("image/png");
        
        // Create download link
        const link = document.createElement('a');
        link.href = image;
        link.download = `رول_جلسات_${selectedDate}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert('تم تحميل صورة الرول بنجاح. يمكنك الآن إرسالها عبر الواتساب.');

      } catch (err) {
        console.error("Error capturing image:", err);
        alert('حدث خطأ أثناء إنشاء الصورة.');
      }
    } else {
        alert('المكتبة المطلوبة غير محملة. يرجى تحديث الصفحة.');
    }
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const getDayName = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('ar-EG', { weekday: 'long' });
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Controls - Hidden in Print */}
      <div className="no-print bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
           <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight /></button>
           <div className="text-center">
             <input 
               type="date" 
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
               className="border rounded-lg p-2 text-center font-bold"
             />
             <p className="text-xs text-gray-500 mt-1">{getDayName(selectedDate)}</p>
           </div>
           <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft /></button>
        </div>
        
        <div className="flex gap-2">
            <button 
            onClick={handleShareImage}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
            title="تحميل كصورة لإرسالها بالواتساب"
            >
            <Share2 size={20} />
            <span className="hidden md:inline">تحميل كصورة (واتساب)</span>
            </button>
            <button 
            onClick={handlePrint}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800"
            >
            <Printer size={20} />
            طباعة الرول
            </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div 
        ref={sheetRef} 
        className="bg-white p-10 rounded-none md:rounded-xl shadow-none md:shadow-lg border-0 md:border min-h-[1000px] print-sheet relative"
        style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}
      >
        {/* Formal Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
            <div className="text-right w-1/3">
                <h2 className="text-lg font-bold">{settings.officeName}</h2>
                <p className="text-sm text-gray-600">للمحاماة والاستشارات القانونية</p>
                <p className="text-sm text-gray-600">المحامي: {settings.lawyerName}</p>
            </div>
            
            <div className="text-center w-1/3 flex flex-col items-center justify-center">
                 {/* Logo Placeholder - You can replace with <img src="..." /> if available */}
                 <div className="w-20 h-20 border-2 border-slate-900 rounded-full flex items-center justify-center mb-2">
                     <Gavel size={32} className="text-slate-900" />
                 </div>
                 <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wide border-2 border-slate-900 px-4 py-1 mt-1 rounded">رول الجلسات</h1>
            </div>

            <div className="text-left w-1/3">
                <div className="inline-block text-center border border-gray-400 p-2 rounded bg-gray-50">
                    <p className="text-xs text-gray-500">التاريخ</p>
                    <p className="font-bold text-lg">{selectedDate}</p>
                    <p className="text-sm border-t border-gray-300 mt-1 pt-1">{getDayName(selectedDate)}</p>
                </div>
            </div>
        </div>

        {sessions.length > 0 ? (
            <table className="w-full text-right border-collapse border-2 border-slate-900">
                <thead>
                    <tr className="bg-slate-100 print:bg-slate-200 text-slate-900">
                        <th className="border border-slate-900 p-3 w-12 text-center font-bold text-sm">م</th>
                        <th className="border border-slate-900 p-3 w-32 font-bold text-sm">رقم القضية</th>
                        <th className="border border-slate-900 p-3 font-bold text-sm">أطراف الدعوى</th>
                        <th className="border border-slate-900 p-3 w-40 font-bold text-sm">المحكمة / الدائرة</th>
                        <th className="border border-slate-900 p-3 font-bold text-sm">نوع الجلسة / المطلوب</th>
                        <th className="border border-slate-900 p-3 w-32 font-bold text-sm">القرار / ما تم</th>
                        <th className="border border-slate-900 p-3 w-24 font-bold text-sm">التأجيل</th>
                    </tr>
                </thead>
                <tbody>
                    {sessions.map((session, index) => {
                        const caseData = cases.find(c => c.id === session.caseId);
                        const clientName = db.getClients().find(c => c.id === caseData?.clientId)?.name;
                        return (
                            <tr key={session.id} className="align-top">
                                <td className="border border-slate-900 p-3 text-center font-bold">{index + 1}</td>
                                <td className="border border-slate-900 p-3">
                                    <div className="font-bold text-lg">{caseData?.caseNumber}</div>
                                </td>
                                <td className="border border-slate-900 p-3 text-sm">
                                    <div className="font-bold mb-1">ضد/ {caseData?.opponentName}</div>
                                    <div className="text-gray-600 text-xs">الموكل: {clientName}</div>
                                </td>
                                <td className="border border-slate-900 p-3 text-sm">
                                    <div className="font-bold">{caseData?.court}</div>
                                    <div className="text-xs">{caseData?.department}</div>
                                </td>
                                <td className="border border-slate-900 p-3 text-sm">
                                    <div className="font-bold mb-1">{session.sessionType}</div>
                                    <div className="text-gray-500 text-xs">{session.notes}</div>
                                </td>
                                <td className="border border-slate-900 p-3"></td>
                                <td className="border border-slate-900 p-3"></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        ) : (
            <div className="text-center py-32 text-gray-400 border-2 border-dashed border-slate-300 rounded bg-slate-50">
                <p className="text-xl font-medium">لا توجد جلسات مجدولة في هذا التاريخ</p>
            </div>
        )}
        
        {/* Footer */}
        <div className="mt-auto pt-12 flex justify-between text-sm print-only absolute bottom-10 left-10 right-10 border-t-2 border-slate-900">
            <div className="text-right">
                <p className="font-bold">المحامي / {settings.lawyerName}</p>
                <p className="mt-8 text-xs text-gray-500">التوقيع ............................</p>
            </div>
            <div className="text-left">
                <p className="font-bold">{settings.printFooter}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;