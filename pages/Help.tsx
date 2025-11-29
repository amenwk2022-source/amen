import React from 'react';
import { HelpCircle, BookOpen, Clock, DollarSign, FileText, Settings } from 'lucide-react';

const Help: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="bg-slate-900 text-white p-2 rounded-lg">
           <HelpCircle size={28} />
        </div>
        <div>
           <h1 className="text-2xl font-bold text-slate-900">مركز المساعدة</h1>
           <p className="text-gray-500">دليل استخدام نظام المحامي الذكي</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-3">
                  <FileText className="text-amber-600" size={20} />
                  إدارة القضايا
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                  يمكنك إضافة قضايا جديدة من صفحة "إدارة القضايا". يجب ربط كل قضية بموكل مسجل مسبقاً.
                  داخل صفحة تفاصيل القضية، يمكنك إدارة الجلسات، المهام، المستندات، والمدفوعات.
                  <br/>
                  <span className="text-xs font-bold text-slate-500 block mt-2">تلميح: يمكنك استخدام البحث السريع في الأعلى للوصول لأي قضية برقمها.</span>
              </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-3">
                  <Clock className="text-amber-600" size={20} />
                  الجلسات والترحيل
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                  نظام "الترحيل الذكي" يتيح لك إغلاق الجلسة الحالية وإنشاء الجلسة القادمة في خطوة واحدة.
                  اضغط زر "ترحيل" في لوحة التحكم أو صفحة القضية، سجل ما تم، وحدد الموعد القادم.
                  سيتم نقل الجلسة الحالية للسجل وإنشاء موعد جديد تلقائياً.
              </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-3">
                  <DollarSign className="text-amber-600" size={20} />
                  الإدارة المالية
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                  سجل جميع الدفعات الواردة من الموكلين والمصروفات التي تم صرفها على القضية.
                  النظام يقوم تلقائياً بحساب "صافي الدخل" لكل قضية، ويعرض تقارير مالية شاملة في صفحة "التقارير".
                  يمكنك طباعة كشف حساب للموكل من صفحته الشخصية.
              </p>
          </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-3">
                  <Settings className="text-amber-600" size={20} />
                  النسخ الاحتياطي
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                  بياناتك محفوظة على المتصفح (جهازك الشخصي).
                  من صفحة "الإعدادات"، قم بعمل "نسخة احتياطية" بشكل دوري واحفظ الملف في مكان آمن.
                  في حال تغيير الجهاز أو المتصفح، يمكنك استعادة البيانات باستخدام هذا الملف.
              </p>
          </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
          <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-bold text-blue-900">هل تحتاج لمزيد من المساعدة؟</h3>
          <p className="text-sm text-blue-700 mt-1">تواصل مع قسم الدعم الفني في مكتبك أو المسؤول عن النظام.</p>
      </div>
    </div>
  );
};

export default Help;