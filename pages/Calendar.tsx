
import React, { useState } from 'react';
import { db } from '../services/db';
import { Printer, ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const sessions = db.getSessions().filter(s => s.sessionDate === selectedDate);
  const cases = db.getCases();
  const settings = db.getSettings();

  const handlePrint = () => {
    window.print();
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Controls - Hidden in Print */}
      <div className="no-print bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
           <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight /></button>
           <input 
             type="date" 
             value={selectedDate}
             onChange={(e) => setSelectedDate(e.target.value)}
             className="border rounded-lg p-2 text-center font-bold"
           />
           <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft /></button>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800"
        >
          <Printer size={20} />
          طباعة الرول
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="bg-white p-8 rounded-none md:rounded-xl shadow-none md:shadow-lg border-0 md:border min-h-[800px] print-sheet">
        <div className="text-center border-b-2 border-black pb-6 mb-6">
            <h3 className="text-sm mb-2">{settings.printHeader}</h3>
            <h1 className="text-3xl font-bold mb-2">رول جلسات</h1>
            <p className="text-xl">تاريخ: {selectedDate}</p>
        </div>

        {sessions.length > 0 ? (
            <table className="w-full text-right border-collapse border border-black">
                <thead>
                    <tr className="bg-gray-100 print:bg-gray-200">
                        <th className="border border-black p-3 w-12 text-center">م</th>
                        <th className="border border-black p-3 w-24">رقم القضية</th>
                        <th className="border border-black p-3 w-28">الرقم الآلي</th>
                        <th className="border border-black p-3">الموكل</th>
                        <th className="border border-black p-3">الخصم</th>
                        <th className="border border-black p-3">المحكمة / الدائرة</th>
                        <th className="border border-black p-3">المطلوب (القرار السابق)</th>
                        <th className="border border-black p-3 w-24">ما تم بالجلسة</th>
                        <th className="border border-black p-3 w-20">التأجيل</th>
                    </tr>
                </thead>
                <tbody>
                    {sessions.map((session, index) => {
                        const caseData = cases.find(c => c.id === session.caseId);
                        const clientName = db.getClients().find(c => c.id === caseData?.clientId)?.name;
                        return (
                            <tr key={session.id}>
                                <td className="border border-black p-3 text-center">{index + 1}</td>
                                <td className="border border-black p-3 font-bold">{caseData?.caseNumber}</td>
                                <td className="border border-black p-3 text-sm">{caseData?.automaticNumber || '-'}</td>
                                <td className="border border-black p-3">{clientName}</td>
                                <td className="border border-black p-3">{caseData?.opponentName}</td>
                                <td className="border border-black p-3 text-sm">
                                    {caseData?.court}
                                    <br/>
                                    {caseData?.department}
                                </td>
                                <td className="border border-black p-3 text-sm">{session.notes || session.sessionType}</td>
                                <td className="border border-black p-3"></td>
                                <td className="border border-black p-3"></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        ) : (
            <div className="text-center py-20 text-gray-500 border border-dashed border-gray-300">
                لا توجد جلسات في هذا التاريخ.
            </div>
        )}
        
        <div className="mt-12 pt-8 border-t border-black flex justify-between text-sm print-only">
            <span>توقيع المحامي: ............................</span>
            <div className="text-left">
                <p className="font-bold">{settings.lawyerName}</p>
                <p>{settings.printFooter}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;