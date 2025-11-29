
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Case, CaseStatus, Client } from '../types';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Download } from 'lucide-react';

const Cases: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    setCases(db.getCases());
    setClients(db.getClients());
  }, []);

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'غير معروف';

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.caseNumber.includes(searchTerm) || 
      (c.automaticNumber && c.automaticNumber.includes(searchTerm)) ||
      c.title.includes(searchTerm) || 
      getClientName(c.clientId).includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = "رقم القضية,الرقم الآلي,العنوان,الموكل,الخصم,المحكمة,الدائرة,الحالة,تاريخ الفتح,قيمة العقد,المدفوع\n";
    const rows = filteredCases.map(c => {
      const clientName = getClientName(c.clientId);
      return `"${c.caseNumber}","${c.automaticNumber || ''}","${c.title}","${clientName}","${c.opponentName}","${c.court}","${c.department}","${c.status}","${c.openedDate}","${c.financialTotal}","${c.financialPaid}"`;
    }).join("\n");

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cases_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddCase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newCase: Case = {
      id: Date.now().toString(),
      caseNumber: formData.get('caseNumber') as string,
      automaticNumber: formData.get('automaticNumber') as string,
      title: formData.get('title') as string,
      clientId: formData.get('clientId') as string,
      opponentName: formData.get('opponentName') as string,
      court: formData.get('court') as string,
      department: formData.get('department') as string,
      status: CaseStatus.UnderFiling,
      financialTotal: Number(formData.get('financialTotal')),
      financialPaid: Number(formData.get('financialPaid')),
      openedDate: new Date().toISOString().split('T')[0]
    };

    db.addCase(newCase);
    setCases(db.getCases());
    setShowAddModal(false);
  };

  const statusColors: Record<string, string> = {
    [CaseStatus.Active]: 'bg-blue-100 text-blue-800',
    [CaseStatus.UnderFiling]: 'bg-yellow-100 text-yellow-800',
    [CaseStatus.Execution]: 'bg-purple-100 text-purple-800',
    [CaseStatus.Closed]: 'bg-green-100 text-green-800',
  };

  const statusLabels: Record<string, string> = {
    [CaseStatus.Active]: 'متداولة',
    [CaseStatus.UnderFiling]: 'تحت الرفع',
    [CaseStatus.Execution]: 'تنفيذ',
    [CaseStatus.Closed]: 'منتهية',
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-900">سجل القضايا</h1>
        <div className="flex gap-2">
            <button 
            onClick={handleExportCSV}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2"
            title="تصدير للقائمة (Excel)"
            >
            <Download size={20} />
            <span className="hidden md:inline">تصدير CSV</span>
            </button>
            <button 
            onClick={() => setShowAddModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
            <Plus size={20} />
            إضافة قضية جديدة
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-2.5 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="بحث برقم القضية، الرقم الآلي، العنوان..."
            className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64 relative">
          <Filter className="absolute right-3 top-2.5 text-gray-400 w-5 h-5" />
          <select 
            className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none appearance-none bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">جميع الحالات</option>
            <option value={CaseStatus.UnderFiling}>تحت الرفع</option>
            <option value={CaseStatus.Active}>متداولة</option>
            <option value={CaseStatus.Execution}>تنفيذ</option>
            <option value={CaseStatus.Closed}>منتهية</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right table-fixed min-w-[900px]">
            <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                <th className="p-4 w-[15%]">رقم القضية</th>
                <th className="p-4 w-[20%]">العنوان</th>
                <th className="p-4 w-[15%]">الموكل</th>
                <th className="p-4 w-[15%]">الخصم</th>
                <th className="p-4 w-[15%]">المحكمة</th>
                <th className="p-4 w-[10%]">الحالة</th>
                <th className="p-4 w-[10%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCases.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 align-top">
                      <div className="font-medium text-slate-900 break-all">{c.caseNumber}</div>
                      {c.automaticNumber && <div className="text-xs text-gray-500 mt-1 break-all">آلي: {c.automaticNumber}</div>}
                  </td>
                  <td className="p-4 align-top break-words">{c.title}</td>
                  <td className="p-4 align-top break-words">{getClientName(c.clientId)}</td>
                  <td className="p-4 text-gray-500 align-top break-words">{c.opponentName}</td>
                  <td className="p-4 text-sm align-top break-words">
                      <div>{c.court}</div>
                      <div className="text-xs text-gray-400">{c.department}</div>
                  </td>
                  <td className="p-4 align-top">
                    <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${statusColors[c.status]}`}>
                      {statusLabels[c.status]}
                    </span>
                  </td>
                  <td className="p-4 align-top">
                    <Link 
                      to={`/cases/${c.id}`}
                      className="text-amber-600 hover:text-amber-800 text-sm font-medium whitespace-nowrap"
                    >
                      عرض التفاصيل
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    لا توجد قضايا تطابق بحثك.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">إضافة قضية جديدة</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCase} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">موضوع الدعوى (العنوان)</label>
                <input required name="title" className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم ملف المكتب</label>
                <input required name="caseNumber" className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الرقم الآلي (المحكمة)</label>
                <input name="automaticNumber" className="w-full border rounded-lg p-2" placeholder="اختياري" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الموكل</label>
                <select required name="clientId" className="w-full border rounded-lg p-2 bg-white">
                  {clients.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الخصم</label>
                <input required name="opponentName" className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المحكمة</label>
                <input required name="court" className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الدائرة</label>
                <input name="department" className="w-full border rounded-lg p-2" />
              </div>
              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h3 className="font-semibold mb-2 text-sm text-gray-900">البيانات المالية</h3>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">إجمالي الأتعاب</label>
                <input type="number" name="financialTotal" className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المدفوع</label>
                <input type="number" name="financialPaid" className="w-full border rounded-lg p-2" />
              </div>
              
              <div className="md:col-span-2 mt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800">حفظ القضية</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 border rounded-lg hover:bg-gray-50">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cases;
