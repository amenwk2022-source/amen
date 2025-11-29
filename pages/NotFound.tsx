import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center">
      <div className="bg-gray-100 p-6 rounded-full mb-6">
        <FileQuestion size={64} className="text-gray-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">الصفحة غير موجودة</h1>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">عذراً، الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها. يرجى التأكد من الرابط أو العودة للرئيسية.</p>
      <Link to="/" className="bg-slate-900 text-white px-8 py-3 rounded-lg hover:bg-slate-800 transition-all font-bold shadow-lg shadow-slate-900/20">
        العودة للرئيسية
      </Link>
    </div>
  );
};

export default NotFound;