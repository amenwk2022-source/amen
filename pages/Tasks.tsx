
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { TaskPriority, TaskStatus, Case, Task } from '../types';
import { CheckSquare, Square, Calendar, User, Flag, Briefcase, Trash2, Edit2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState(db.getTasks());
  const [cases, setCases] = useState<Case[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');

  useEffect(() => {
    setCases(db.getCases());
  }, []);

  const handleSaveTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const caseId = fd.get('caseId') as string;
    
    if (editingTask) {
        // Update existing
        const updatedTask: Task = {
            ...editingTask,
            title: fd.get('title') as string,
            assignee: fd.get('assignee') as string,
            priority: fd.get('priority') as TaskPriority,
            dueDate: fd.get('dueDate') as string,
            caseId: caseId || undefined
        };
        db.updateTask(updatedTask);
        setEditingTask(null);
    } else {
        // Add new
        db.addTask({
            id: Date.now().toString(),
            title: fd.get('title') as string,
            assignee: fd.get('assignee') as string,
            priority: fd.get('priority') as TaskPriority,
            dueDate: fd.get('dueDate') as string,
            status: TaskStatus.Pending,
            caseId: caseId || undefined
        });
    }
    
    setTasks(db.getTasks());
    setIsFormOpen(false);
  };

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if(task) {
      db.updateTask({
        ...task,
        status: task.status === TaskStatus.Pending ? TaskStatus.Done : TaskStatus.Pending
      });
      setTasks(db.getTasks());
    }
  };

  const deleteTask = (id: string) => {
    if(confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      db.deleteTask(id);
      setTasks(db.getTasks());
    }
  };

  const openEdit = (task: Task) => {
      setEditingTask(task);
      setIsFormOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
      setIsFormOpen(false);
      setEditingTask(null);
  }

  const priorityColors = {
    [TaskPriority.High]: 'bg-red-100 text-red-700',
    [TaskPriority.Medium]: 'bg-yellow-100 text-yellow-700',
    [TaskPriority.Low]: 'bg-blue-100 text-blue-700',
  };

  const filteredTasks = tasks.filter(t => {
      if (filter === 'pending') return t.status === TaskStatus.Pending;
      if (filter === 'done') return t.status === TaskStatus.Done;
      return true;
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
         <h1 className="text-2xl font-bold text-slate-900">المهام الإدارية</h1>
         <button onClick={() => { setIsFormOpen(!isFormOpen); setEditingTask(null); }} className="bg-slate-900 text-white px-4 py-2 rounded-lg">
             {isFormOpen ? 'إغلاق' : 'مهمة جديدة'}
         </button>
      </div>
      
      {isFormOpen && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 relative">
              <button onClick={closeForm} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600">
                  <X size={20} />
              </button>
              <h3 className="font-bold mb-4 border-b pb-2">
                  {editingTask ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
              </h3>
              <form onSubmit={handleSaveTask} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-4">
                      <label className="block text-xs text-gray-500 mb-1">العنوان</label>
                      <input required name="title" defaultValue={editingTask?.title} className="w-full border rounded-lg p-2" placeholder="عنوان المهمة..." />
                  </div>
                  <div>
                      <label className="block text-xs text-gray-500 mb-1">المسؤول</label>
                      <input name="assignee" defaultValue={editingTask?.assignee} className="w-full border rounded-lg p-2" placeholder="المسؤول" />
                  </div>
                  <div>
                      <label className="block text-xs text-gray-500 mb-1">الأولوية</label>
                      <select name="priority" defaultValue={editingTask?.priority} className="w-full border rounded-lg p-2 bg-white">
                          <option value={TaskPriority.Medium}>متوسطة</option>
                          <option value={TaskPriority.High}>عاجلة</option>
                          <option value={TaskPriority.Low}>عادية</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-xs text-gray-500 mb-1">تاريخ الاستحقاق</label>
                      <input required type="date" name="dueDate" defaultValue={editingTask?.dueDate} className="w-full border rounded-lg p-2" />
                  </div>
                  <div className="md:col-span-3">
                      <label className="block text-xs text-gray-500 mb-1">ربط بقضية (اختياري)</label>
                      <select name="caseId" defaultValue={editingTask?.caseId || ''} className="w-full border rounded-lg p-2 bg-white">
                          <option value="">-- بدون قضية --</option>
                          {cases.map(c => (
                              <option key={c.id} value={c.id}>{c.caseNumber} - {c.title}</option>
                          ))}
                      </select>
                  </div>
                  <div className="flex items-end">
                      <button className="w-full bg-amber-600 text-white p-2 rounded-lg hover:bg-amber-700">
                          {editingTask ? 'تحديث' : 'حفظ'}
                      </button>
                  </div>
              </form>
          </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium ${filter === 'all' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
              الكل
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 font-medium ${filter === 'pending' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
              قيد الانتظار
          </button>
          <button 
            onClick={() => setFilter('done')}
            className={`px-4 py-2 font-medium ${filter === 'done' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
              مكتملة
          </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredTasks.map(task => {
            const linkedCase = task.caseId ? cases.find(c => c.id === task.caseId) : null;
            return (
              <div key={task.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 gap-4 group">
                <div className="flex items-start gap-3 flex-1">
                  <button onClick={() => toggleTask(task.id)} className={`mt-1 ${task.status === TaskStatus.Done ? 'text-green-500' : 'text-gray-300'}`}>
                    {task.status === TaskStatus.Done ? <CheckSquare /> : <Square />}
                  </button>
                  <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-medium ${task.status === TaskStatus.Done ? 'line-through text-gray-400' : 'text-slate-900'}`}>
                              {task.title}
                          </p>
                          {linkedCase && (
                              <Link to={`/cases/${linkedCase.id}`} className="flex items-center gap-1 text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-200">
                                  <Briefcase size={10} />
                                  {linkedCase.caseNumber}
                              </Link>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded ${priorityColors[task.priority]}`}>
                            {task.priority === TaskPriority.High ? 'عاجل' : task.priority === TaskPriority.Medium ? 'متوسط' : 'عادي'}
                          </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><User size={12}/> {task.assignee}</span>
                          <span className="flex items-center gap-1"><Calendar size={12}/> {task.dueDate}</span>
                      </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                    onClick={() => openEdit(task)}
                    className="text-gray-300 hover:text-blue-500"
                    title="تعديل المهمة"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                    onClick={() => deleteTask(task.id)}
                    className="text-gray-300 hover:text-red-500"
                    title="حذف المهمة"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
              </div>
            );
          })}
          {filteredTasks.length === 0 && <div className="p-8 text-center text-gray-500">لا توجد مهام تطابق الفلتر الحالي.</div>}
        </div>
      </div>
    </div>
  );
};

export default Tasks;
