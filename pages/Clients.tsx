import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { ClientType } from '../types';
import { User, Building, Phone, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const Clients: React.FC = () => {
  const [clients, setClients] = useState(db.getClients());
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setClients(db.getClients());
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    db.addClient({
      id: Date.now().toString(),
      name: fd.get('name') as string,
      type: fd.get('type') as ClientType,
      phone: fd.get('phone') as string,
      email: fd.get('email') as string,
      address: fd.get('address') as string,
      createdAt: new Date().toISOString()
    });
    setClients(db.getClients());
    setShowModal(false);
  };

  const filteredClients = clients.filter(c => 
    c.name.includes(searchTerm) || 
    c.phone.includes(searchTerm) ||
    c.email.includes(searchTerm)
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">الموكلين</h1>
        <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg">إضافة موكل</button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 relative">
        <Search className="absolute right-6 top-6 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="بحث عن موكل (الاسم، الهاتف، البريد)..."
          className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <Link to={`/clients/${client.id}`} key={client.id} className="block group">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group-hover:border-amber-400 transition-colors h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${client.type === ClientType.Company ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                    {client.type === ClientType.Company ? <Building size={20}/> : <User size={20}/>}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{client.name}</h3>
                    <span className="text-xs text-gray-500">{client.type === ClientType.Company ? 'شركة' : 'فرد'}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  {client.phone}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span className="truncate">{client.address}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {filteredClients.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            لا توجد نتائج مطابقة للبحث.
          </div>
        )}
      </div>

       {/* Add Modal */}
       {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <h2 className="p-6 border-b text-xl font-bold">إضافة موكل جديد</h2>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input required name="name" placeholder="الاسم" className="w-full border rounded p-2" />
              <select name="type" className="w-full border rounded p-2">
                <option value={ClientType.Individual}>فرد</option>
                <option value={ClientType.Company}>شركة</option>
              </select>
              <input required name="phone" placeholder="رقم الهاتف" className="w-full border rounded p-2" />
              <input name="email" placeholder="البريد الإلكتروني" className="w-full border rounded p-2" />
              <textarea name="address" placeholder="العنوان" className="w-full border rounded p-2"></textarea>
              <button className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800">حفظ</button>
              <button type="button" onClick={() => setShowModal(false)} className="w-full border py-2 rounded hover:bg-gray-50">إلغاء</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;