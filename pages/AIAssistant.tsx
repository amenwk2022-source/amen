
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Send, Bot, User, Loader2, Sparkles, AlertTriangle, Globe } from 'lucide-react';
import { db } from '../services/db';

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string, grounding?: any[]}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const settings = db.getSettings();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `أنت مساعد قانوني ذكي ومحترف ("المستشار الذكي") تعمل لدى ${settings.officeName}.
      
      الموقع الجغرافي والإطار القانوني:
      أنت خبير في الأنظمة والقوانين المعمول بها في "${settings.country || 'المملكة العربية السعودية'}".
      يجب أن تكون جميع إجاباتك واستشهاداتك القانونية متوافقة مع أنظمة هذه الدولة حصراً.

      مهامك الأساسية:
      1. صياغة العقود والمذكرات واللوائح القانونية بدقة عالية وفقاً لقوانين ${settings.country}.
      2. البحث في الأنظمة وتوضيح المواد القانونية ذات الصلة.
      3. تقديم ملخصات قانونية واقتراح استراتيجيات.
      4. المساعدة في صياغة الخطابات الرسمية.

      القواعد:
      - استخدم لغة قانونية رصينة ومهنية.
      - عند الاستشهاد بنظام، اذكر اسم النظام ورقم المادة إن أمكن.
      - لا تقدم فتاوى شرعية ولا نصائح طبية.
      - إذا سأل المستخدم عن أخبار أو معلومات حديثة، استخدم أداة البحث.
      - نبه المستخدم دائماً أن إجابتك استرشادية ولا تغني عن المراجعة النهائية للمحامي.`;

      // Create a placeholder for the model's response
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
            systemInstruction: systemInstruction,
            tools: [{ googleSearch: {} }] // Enable Google Search
        }
      });

      const text = response.text || "عذراً، لم أتمكن من توليد إجابة.";
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

      setMessages(prev => {
        const newArr = [...prev];
        newArr[newArr.length - 1] = { role: 'model', text: text, grounding: groundingChunks };
        return newArr;
      });

    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const newArr = [...prev];
        // If the last message was empty (placeholder), replace it. Otherwise append error.
        if (newArr.length > 0 && newArr[newArr.length - 1].role === 'model' && newArr[newArr.length - 1].text === '') {
             newArr[newArr.length - 1] = { role: 'model', text: "حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى." };
        } else {
             newArr.push({ role: 'model', text: "حدث خطأ أثناء الاتصال بالخادم." });
        }
        return newArr;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-slate-900 p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-lg text-white">
                <Bot size={24} />
            </div>
            <div>
                <h1 className="text-white font-bold text-lg">المستشار الذكي</h1>
                <p className="text-slate-400 text-xs">خبير في أنظمة {settings.country}</p>
            </div>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full text-xs text-amber-500 border border-slate-700">
            <Sparkles size={12} />
            <span>متصل بقاعدة البيانات القانونية</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                    <Sparkles size={48} className="text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-700 mb-2">مرحباً! أنا مستشارك الذكي.</h2>
                <p className="text-sm mb-6">اسألني عن القضايا، صياغة العقود، أو الأنظمة في {settings.country}.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                    <button onClick={() => setInput("أريد صياغة عقد عمل قانوني")} className="bg-white border border-gray-200 p-3 rounded-lg text-sm text-right hover:border-amber-500 hover:text-amber-600 transition-colors">
                        📝 أريد صياغة عقد عمل...
                    </button>
                    <button onClick={() => setInput("ما هي إجراءات رفع الدعوى القضائية؟")} className="bg-white border border-gray-200 p-3 rounded-lg text-sm text-right hover:border-amber-500 hover:text-amber-600 transition-colors">
                        ⚖️ إجراءات رفع الدعوى
                    </button>
                    <button onClick={() => setInput(`ما هي أحدث التعديلات القانونية في ${settings.country}؟`)} className="bg-white border border-gray-200 p-3 rounded-lg text-sm text-right hover:border-amber-500 hover:text-amber-600 transition-colors">
                        🔍 أحدث التعديلات القانونية
                    </button>
                    <button onClick={() => setInput("اكتب صيغة خطاب مطالبة مالية لشركة")} className="bg-white border border-gray-200 p-3 rounded-lg text-sm text-right hover:border-amber-500 hover:text-amber-600 transition-colors">
                        ✉️ صيغة خطاب مطالبة مالية
                    </button>
                </div>
            </div>
        )}
        {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-white border border-gray-200' : 'bg-amber-600 text-white'}`}>
                    {msg.role === 'user' ? <User size={16} className="text-slate-600" /> : <Bot size={16} />}
                </div>
                <div className={`max-w-[85%] md:max-w-[70%] space-y-2`}>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-slate-800 rounded-tl-none'}`}>
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                    
                    {/* Render Grounding Sources */}
                    {msg.grounding && msg.grounding.length > 0 && (
                        <div className="bg-white border border-gray-200 p-3 rounded-xl text-xs space-y-2 shadow-sm">
                            <p className="font-bold text-gray-500 flex items-center gap-1">
                                <Globe size={12} />
                                المصادر والمراجع:
                            </p>
                            <ul className="space-y-1">
                                {msg.grounding.map((chunk, i) => {
                                    if (chunk.web?.uri) {
                                        return (
                                            <li key={i}>
                                                <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 truncate">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                                                    {chunk.web.title || chunk.web.uri}
                                                </a>
                                            </li>
                                        );
                                    }
                                    return null;
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        ))}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-white" />
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-none flex items-center shadow-sm">
                    <Loader2 size={16} className="animate-spin text-amber-600" />
                    <span className="mr-2 text-xs text-gray-500">جاري البحث والكتابة...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
         <div className="flex items-center gap-2 bg-amber-50 text-amber-800 text-xs p-2 rounded-lg mb-2">
            <AlertTriangle size={12} />
            <span>المساعد الذكي قد يرتكب أخطاء. يرجى مراجعة المعلومات القانونية الهامة.</span>
         </div>
         <form onSubmit={handleSend} className="flex gap-2">
            <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50 focus:bg-white transition-all disabled:opacity-50"
                disabled={isLoading}
            />
            <button 
                disabled={isLoading || !input.trim()} 
                className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-slate-900/10"
            >
                <Send size={20} className={isLoading ? 'hidden' : 'block transform -rotate-180'} />
                {isLoading && <Loader2 size={20} className="animate-spin" />}
            </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;