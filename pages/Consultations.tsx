
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Consultation, Client } from '../types';
import { MessageSquare, Plus, Search, DollarSign, CheckCircle, XCircle, Trash2, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Consultations: React.FC = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Consultation | null>(null);

  useEffect(() => {
    setConsultations(db.getConsultations().sort((a,b) => b.date.localeCompare(a.date)));
    setClients(db.getClients());
  }, []);

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'غير معروف';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    if (editingItem) {
        const updated: Consultation = {
            ...editingItem,
            clientId: fd.get('clientId') as string,
            date: fd.get('date') as string,
            topic: fd.get('topic') as string,
            price: Number(fd.get('price')),
            isPaid: fd.get('isPaid') === 'on',
            notes: fd.get('notes') as string
        };
        db.updateConsultation(updated);
        setEditingItem(null);
    } else {
        const newItem: Consultation = {
            id: Date.now().toString(),
            clientId: fd.get('clientId') as string,
            date: fd.get('date') as string,
            topic: fd.get('topic') as string,
            price: Number(fd.get('price')),
            isPaid: fd.get('isPaid') === 'on',
            notes: fd.get('notes') as string
        };
        db.addConsultation(newItem);
    }
    setConsultations(db.getConsultations().sort((a,b) => b.date.localeCompare(a.date)));
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
      if(confirm('حذف هذه الاستشارة؟')) {
          db.deleteConsultation(id);
          setConsultations(db.getConsultations());
      }
  }

  const filtered = consultations.filter(c => 
    c.topic.includes(searchTerm) || 
    getClientName(c.clientId).includes(searchTerm)
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="text-amber-600" />
            الاستشارات القانونية
        </h1>
        <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus size={20} />
            استشارة جديدة
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 relative">
        <Search className="absolute right-6 top-6 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="بحث عن استشارة (الموضوع، اسم الموكل)..."
          className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.isPaid ? 'مدفوعة' : 'غير مدفوعة'}
                      </span>
                      <span className="text-xs text-gray-500">{item.date}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem(item); setShowModal(true); }} className="text-gray-400 hover:text-blue-600"><Edit2 size={16}/></button>
                      <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                  </div>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{item.topic}</h3>
              <p className="text-sm text-amber-600 mb-4 flex items-center gap-1">
                  <Link to={`/clients/${item.clientId}`} className="hover:underline">{getClientName(item.clientId)}</Link>
              </p>
              
              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-3 min-h-[60px]">
                  {item.notes || 'لا توجد تفاصيل إضافية'}
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-sm text-gray-500">قيمة الاستشارة</span>
                  <span className="font-bold text-lg text-slate-900 flex items-center">
                      {item.price.toLocaleString()} <span className="text-xs text-gray-400 mr-1">ر.س</span>
                  </span>
              </div>
          </div>
        ))}
        {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">
                لا توجد استشارات مسجلة.
            </div>
        )}
      </div>

       {/* Modal */}
       {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <h2 className="p-6 border-b text-xl font-bold">{editingItem ? 'تعديل استشارة' : 'تسجيل استشارة جديدة'}</h2>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الموكل</label>
                  <select name="clientId" required defaultValue={editingItem?.clientId} className="w-full border rounded p-2 bg-white">
                    <option value="">-- اختر الموكل --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الموضوع</label>
                  <input required name="topic" defaultValue={editingItem?.topic} className="w-full border rounded p-2" placeholder="مثال: استشارة في قانون العمل" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                    <input type="date" required name="date" defaultValue={editingItem?.date || new Date().toISOString().split('T')[0]} className="w-full border rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">القيمة (ر.س)</label>
                    <input type="number" required name="price" defaultValue={editingItem?.price} className="w-full border rounded p-2" />
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">التفاصيل / الملاحظات</label>
                  <textarea name="notes" defaultValue={editingItem?.notes} className="w-full border rounded p-2" rows={3}></textarea>
              </div>
              <div className="flex items-center gap-2">
                  <input type="checkbox" name="isPaid" id="isPaid" defaultChecked={editingItem?.isPaid} className="w-5 h-5 text-amber-600 rounded" />
                  <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">تم السداد</label>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button className="flex-1 bg-slate-900 text-white py-2 rounded hover:bg-slate-800">{editingItem ? 'تحديث' : 'حفظ'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded hover:bg-gray-50">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consultations;
