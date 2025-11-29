
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Payment, Case, CaseExpense } from '../types';
import { TrendingUp, DollarSign, Wallet, FileText, Calendar, TrendingDown, Download } from 'lucide-react';

const Reports: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<CaseExpense[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<{ month: string, amount: number, expense: number }[]>([]);

  useEffect(() => {
    const allPayments = db.getPayments();
    const allExpenses = db.getExpenses();
    const allCases = db.getCases();
    setPayments(allPayments);
    setExpenses(allExpenses);
    setCases(allCases);

    // Calculate Monthly Data
    const dataMap = new Map<string, { income: number, expense: number }>();
    
    // Process Income
    allPayments.forEach(p => {
        const month = p.date.substring(0, 7); // YYYY-MM
        const current = dataMap.get(month) || { income: 0, expense: 0 };
        dataMap.set(month, { ...current, income: current.income + p.amount });
    });

    // Process Expenses
    allExpenses.forEach(e => {
        const month = e.date.substring(0, 7); // YYYY-MM
        const current = dataMap.get(month) || { income: 0, expense: 0 };
        dataMap.set(month, { ...current, expense: current.expense + e.amount });
    });

    const chartData = Array.from(dataMap.entries())
        .map(([month, data]) => ({ month, amount: data.income, expense: data.expense }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6); // Last 6 months

    setMonthlyIncome(chartData);
  }, []);

  const handleExportCSV = () => {
    // Combine payments and expenses for export
    const rows = [
        ...payments.map(p => ({ date: p.date, type: 'وارد', amount: p.amount, note: p.note })),
        ...expenses.map(e => ({ date: e.date, type: 'مصروف', amount: -e.amount, note: e.title }))
    ].sort((a,b) => b.date.localeCompare(a.date));

    const headers = "التاريخ,النوع,المبلغ,البيان\n";
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + rows.map(r => `"${r.date}","${r.type}","${r.amount}","${r.note}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary Stats
  const totalAgreed = cases.reduce((sum, c) => sum + c.financialTotal, 0);
  const totalCollected = cases.reduce((sum, c) => sum + c.financialPaid, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalNet = totalCollected - totalExpenses;

  const maxVal = Math.max(...monthlyIncome.map(m => Math.max(m.amount, m.expense)), 1);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="text-amber-600" />
                التقارير المالية والتحليلات
            </h1>
            <p className="text-gray-500 mt-1">نظرة شاملة على الأداء المالي للمكتب</p>
         </div>
         <button 
            onClick={handleExportCSV}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2"
         >
            <Download size={20} />
            تصدير تقرير
         </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-slate-900"></div>
            <div>
                <p className="text-gray-500 text-sm mb-1">إجمالي العقود</p>
                <h3 className="text-2xl font-bold text-slate-900">{totalAgreed.toLocaleString()} <span className="text-xs font-normal text-gray-400">ر.س</span></h3>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
            <div>
                <p className="text-gray-500 text-sm mb-1">إجمالي التحصيل</p>
                <h3 className="text-2xl font-bold text-green-600">{totalCollected.toLocaleString()} <span className="text-xs font-normal text-gray-400">ر.س</span></h3>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
            <div>
                <p className="text-gray-500 text-sm mb-1">إجمالي المصروفات</p>
                <h3 className="text-2xl font-bold text-red-600">{totalExpenses.toLocaleString()} <span className="text-xs font-normal text-gray-400">ر.س</span></h3>
            </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
            <div>
                <p className="text-gray-500 text-sm mb-1">صافي الأرباح</p>
                <h3 className="text-2xl font-bold text-slate-800">{totalNet.toLocaleString()} <span className="text-xs font-normal text-gray-400">ر.س</span></h3>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Income Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                <Calendar size={18} />
                الدخل والمصروفات (آخر 6 أشهر)
            </h3>
            
            {monthlyIncome.length > 0 ? (
                <div className="flex items-end justify-around h-64 gap-4 px-4">
                    {monthlyIncome.map((item) => (
                        <div key={item.month} className="flex flex-col items-center gap-2 group w-full">
                            <div className="relative w-full max-w-[60px] flex items-end justify-center h-full gap-1">
                                {/* Income Bar */}
                                <div 
                                    className="w-1/2 bg-green-600 rounded-t-sm transition-all duration-500 hover:opacity-80 relative"
                                    style={{ height: `${(item.amount / maxVal) * 100}%` }}
                                    title={`دخل: ${item.amount}`}
                                ></div>
                                {/* Expense Bar */}
                                <div 
                                    className="w-1/2 bg-red-500 rounded-t-sm transition-all duration-500 hover:opacity-80 relative"
                                    style={{ height: `${(item.expense / maxVal) * 100}%` }}
                                    title={`مصروف: ${item.expense}`}
                                ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-500">{item.month}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 border border-dashed rounded-lg">
                    لا توجد بيانات مالية كافية للعرض.
                </div>
            )}
             <div className="flex justify-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-green-600 rounded-sm"></span> دخل</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-sm"></span> مصروف</div>
            </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="font-bold text-lg text-slate-800 mb-4">آخر العمليات</h3>
            <div className="flex-1 overflow-y-auto max-h-[400px] space-y-1">
                {[...payments.map(p => ({...p, type: 'income'})), ...expenses.map(e => ({...e, type: 'expense', note: e.title}))]
                 .sort((a,b) => b.date.localeCompare(a.date))
                 .slice(0, 10)
                 .map((item: any) => (
                    <div key={item.id + item.type} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded transition-colors">
                        <div>
                            <p className={`font-bold text-sm ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {item.type === 'income' ? '+' : '-'} {item.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">{item.date}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-medium text-slate-600 truncate w-24" title={item.note}>{item.note}</p>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {item.type === 'income' ? 'دفعة واردة' : 'مصروف'}
                            </span>
                        </div>
                    </div>
                ))}
                {(payments.length === 0 && expenses.length === 0) && <p className="text-center text-gray-500 text-sm py-4">لا توجد عمليات مسجلة.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
