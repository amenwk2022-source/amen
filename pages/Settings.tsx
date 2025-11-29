
import React, { useState, useRef } from 'react';
import { db } from '../services/db';
import { AppSettings } from '../types';
import { Save, Settings as SettingsIcon, Download, Upload, AlertTriangle, RefreshCw, Globe, DollarSign } from 'lucide-react';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(db.getSettings());
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const countries = [
    { name: 'المملكة العربية السعودية', currency: 'ر.س' },
    { name: 'مصر', currency: 'ج.م' },
    { name: 'الإمارات العربية المتحدة', currency: 'د.إ' },
    { name: 'الكويت', currency: 'د.ك' },
    { name: 'قطر', currency: 'ر.ق' },
    { name: 'البحرين', currency: 'د.ب' },
    { name: 'سلطنة عمان', currency: 'ر.ع' },
    { name: 'الأردن', currency: 'د.ا' },
    { name: 'أخرى', currency: '$' }
  ];

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedCountry = countries.find(c => c.name === e.target.value);
      if (selectedCountry) {
          // Auto update currency input via state binding, but user can still edit it via input
          const currencyInput = document.querySelector('input[name="currency"]') as HTMLInputElement;
          if(currencyInput) currencyInput.value = selectedCountry.currency;
      }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newSettings: AppSettings = {
      officeName: fd.get('officeName') as string,
      lawyerName: fd.get('lawyerName') as string,
      printHeader: fd.get('printHeader') as string,
      printFooter: fd.get('printFooter') as string,
      country: fd.get('country') as string,
      currency: fd.get('currency') as string,
    };
    db.saveSettings(newSettings);
    setSettings(newSettings);
    setSaved(true);
    setTimeout(() => {
        setSaved(false);
        window.location.reload(); // Reload to update layout
    }, 1500);
  };

  const handleExport = () => {
    const json = db.exportDatabase();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart_lawyer_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (confirm('هل أنت متأكد من استعادة النسخة الاحتياطية؟ سيتم استبدال جميع البيانات الحالية.')) {
            const success = db.importDatabase(content);
            if (success) {
                alert('تمت استعادة البيانات بنجاح!');
                window.location.reload();
            } else {
                alert('حدث خطأ أثناء استيراد الملف. تأكد من صحة الملف.');
            }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
      const confirmation = prompt('تحذير: سيتم حذف جميع البيانات والعودة لضبط المصنع. للتأكيد اكتب "حذف"');
      if (confirmation === 'حذف') {
          db.resetDatabase();
      }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-slate-900 text-white p-2 rounded-lg">
            <SettingsIcon size={24} />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-slate-900">إعدادات النظام</h1>
            <p className="text-gray-500">تخصيص بيانات المكتب وإدارة البيانات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-slate-800 border-b pb-2">بيانات المكتب والدولة</h3>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم المكتب / المؤسسة</label>
                    <input required name="officeName" defaultValue={settings.officeName} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500 outline-none" placeholder="مثال: مكتب المحامي الذكي" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم المحامي الرئيسي</label>
                    <input required name="lawyerName" defaultValue={settings.lawyerName} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <Globe size={14} /> دولة العمل
                        </label>
                        <select 
                            name="country" 
                            defaultValue={settings.country || 'المملكة العربية السعودية'} 
                            onChange={handleCountryChange}
                            className="w-full border rounded-lg p-3 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                        >
                            {countries.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                        <p className="text-[10px] text-gray-400 mt-1">يؤثر على استجابات الذكاء الاصطناعي (القوانين)</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <DollarSign size={14} /> العملة
                        </label>
                        <input name="currency" defaultValue={settings.currency || 'ر.س'} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500 outline-none" />
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <h3 className="font-bold text-lg text-slate-800 border-b pb-2">إعدادات الطباعة</h3>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ترويسة الطباعة (اختياري)</label>
                    <input name="printHeader" defaultValue={settings.printHeader} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تذييل الطباعة</label>
                    <input name="printFooter" defaultValue={settings.printFooter} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
            </div>

            <div className="pt-6">
                <button className="w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800 flex items-center justify-center gap-2 font-bold transition-all">
                    <Save size={20} />
                    {saved ? 'تم الحفظ!' : 'حفظ الإعدادات'}
                </button>
                {saved && <p className="text-center text-green-600 text-sm mt-2">سيتم إعادة تحميل الصفحة لتطبيق التغييرات...</p>}
            </div>
            </form>
        </div>

        {/* Data Management Sidebar */}
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <RefreshCw size={18} />
                    إدارة البيانات
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                    يمكنك تحميل نسخة كاملة من بيانات القضايا والموكلين لحفظها أو نقلها لجهاز آخر.
                </p>
                
                <div className="space-y-3">
                    <button 
                        onClick={handleExport}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-200"
                    >
                        <Download size={18} />
                        تحميل نسخة احتياطية
                    </button>

                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".json" 
                        className="hidden" 
                    />
                    <button 
                        onClick={handleImportClick}
                        className="w-full bg-white hover:bg-amber-50 text-amber-700 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors border border-amber-200"
                    >
                        <Upload size={18} />
                        استعادة نسخة
                    </button>
                </div>
            </div>

             <div className="bg-red-50 rounded-xl shadow-sm border border-red-100 p-6">
                <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    منطقة الخطر
                </h3>
                <p className="text-xs text-red-600 mb-4">
                    حذف جميع البيانات وإعادة النظام لحالة المصنع. لا يمكن التراجع عن هذا الإجراء.
                </p>
                <button 
                    onClick={handleReset}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-bold"
                >
                    حذف كافة البيانات
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;