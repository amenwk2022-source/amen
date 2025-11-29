
import { Client, Case, Session, Task, ClientType, CaseStatus, SessionStatus, TaskPriority, TaskStatus, CaseDocument, Payment, CaseExpense, AppSettings, Consultation } from '../types';

// Initial Mock Data
const INITIAL_CLIENTS: Client[] = [
  { id: '1', name: 'شركة المقاولات الحديثة', type: ClientType.Company, phone: '0501234567', email: 'contact@modern.com', address: 'الرياض، شارع الملك فهد', createdAt: new Date().toISOString() },
  { id: '2', name: 'أحمد محمد علي', type: ClientType.Individual, phone: '0559876543', email: 'ahmed@email.com', address: 'جدة، حي السلام', createdAt: new Date().toISOString() }
];

const INITIAL_CASES: Case[] = [
  { id: '101', caseNumber: '4521/2023', automaticNumber: '445102394', title: 'دعوى تعويض عمالي', clientId: '2', opponentName: 'شركة البناء المحدودة', court: 'المحكمة العمالية', department: 'الدائرة الأولى', status: CaseStatus.Active, financialTotal: 15000, financialPaid: 5000, openedDate: '2023-11-01' },
  { id: '102', caseNumber: '9822/2024', automaticNumber: '445291882', title: 'فسخ عقد توريد', clientId: '1', opponentName: 'مصنع الحديد', court: 'المحكمة التجارية', department: 'الدائرة التجارية الخامسة', status: CaseStatus.UnderFiling, financialTotal: 50000, financialPaid: 20000, openedDate: '2024-01-15' }
];

const INITIAL_SESSIONS: Session[] = [
  { id: 's1', caseId: '101', sessionDate: new Date().toISOString().split('T')[0], sessionType: 'جلسة مرافعة', notes: '', judgeName: 'د. خالد العتيبي', status: SessionStatus.Upcoming },
  { id: 's2', caseId: '102', sessionDate: '2024-02-20', sessionType: 'تقديم مستندات', notes: 'تم تقديم لائحة الدعوى', judgeName: 'المستشار فهد', status: SessionStatus.Completed }
];

const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'إيداع مذكرة الرد', assignee: 'محمود', priority: TaskPriority.High, dueDate: new Date().toISOString().split('T')[0], status: TaskStatus.Pending, caseId: '101' },
  { id: 't2', title: 'تجديد الوكالة', assignee: 'سارة', priority: TaskPriority.Low, dueDate: '2024-03-01', status: TaskStatus.Pending }
];

const INITIAL_DOCUMENTS: CaseDocument[] = [
  { id: 'd1', caseId: '101', title: 'لائحة الدعوى', type: 'pdf', uploadDate: '2023-11-02' },
  { id: 'd2', caseId: '101', title: 'صورة الهوية', type: 'image', uploadDate: '2023-11-01' }
];

const INITIAL_PAYMENTS: Payment[] = [
  { id: 'p1', caseId: '101', amount: 5000, date: '2023-11-05', note: 'دفعة مقدمة' },
  { id: 'p2', caseId: '102', amount: 20000, date: '2024-01-20', note: 'الدفعة الأولى عند توقيع العقد' }
];

const INITIAL_EXPENSES: CaseExpense[] = [
  { id: 'e1', caseId: '101', amount: 500, date: '2023-11-02', title: 'رسوم رفع الدعوى', category: 'court_fee' },
  { id: 'e2', caseId: '102', amount: 1200, date: '2024-01-15', title: 'تصديق مستندات', category: 'other' }
];

const INITIAL_CONSULTATIONS: Consultation[] = [
  { id: 'c1', clientId: '2', date: '2023-10-15', topic: 'استشارة في عقد عمل', price: 500, isPaid: true, notes: 'تم مراجعة العقد وإبداء الملاحظات' }
];

const INITIAL_SETTINGS: AppSettings = {
  officeName: 'مكتب المحامي الذكي',
  lawyerName: 'المحامي الرئيسي',
  printHeader: 'بسم الله الرحمن الرحيم',
  printFooter: 'نظام المحامي الذكي للإدارة القانونية',
  country: 'المملكة العربية السعودية',
  currency: 'ر.س'
};

class DBService {
  private get<T>(key: string, initial: T): T {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : initial;
  }

  private set(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
    this.notifyUpdate();
  }

  // Dispatch event for real-time updates
  private notifyUpdate() {
    window.dispatchEvent(new Event('db-update'));
  }

  // Clients
  getClients(): Client[] { return this.get('clients', INITIAL_CLIENTS); }
  addClient(client: Client) { const list = this.getClients(); list.push(client); this.set('clients', list); }
  updateClient(updated: Client) {
    const list = this.getClients().map(c => c.id === updated.id ? updated : c);
    this.set('clients', list);
  }
  deleteClient(id: string) {
    const list = this.getClients().filter(c => c.id !== id);
    this.set('clients', list);
  }

  // Cases
  getCases(): Case[] { return this.get('cases', INITIAL_CASES); }
  addCase(newCase: Case) { const list = this.getCases(); list.push(newCase); this.set('cases', list); }
  updateCase(updated: Case) {
    const list = this.getCases().map(c => c.id === updated.id ? updated : c);
    this.set('cases', list);
  }
  deleteCase(id: string) {
    const list = this.getCases().filter(c => c.id !== id);
    this.set('cases', list);
  }

  // Sessions
  getSessions(): Session[] { return this.get('sessions', INITIAL_SESSIONS); }
  addSession(session: Session) { const list = this.getSessions(); list.push(session); this.set('sessions', list); }
  updateSession(updated: Session) {
    const list = this.getSessions().map(s => s.id === updated.id ? updated : s);
    this.set('sessions', list);
  }
  deleteSession(id: string) {
    const list = this.getSessions().filter(s => s.id !== id);
    this.set('sessions', list);
  }

  // Tasks
  getTasks(): Task[] { return this.get('tasks', INITIAL_TASKS); }
  addTask(task: Task) { const list = this.getTasks(); list.push(task); this.set('tasks', list); }
  updateTask(updated: Task) {
    const list = this.getTasks().map(t => t.id === updated.id ? updated : t);
    this.set('tasks', list);
  }
  deleteTask(id: string) {
    const list = this.getTasks().filter(t => t.id !== id);
    this.set('tasks', list);
  }

  // Documents
  getDocuments(): CaseDocument[] { return this.get('documents', INITIAL_DOCUMENTS); }
  addDocument(doc: CaseDocument) { const list = this.getDocuments(); list.push(doc); this.set('documents', list); }
  deleteDocument(id: string) {
    const list = this.getDocuments().filter(d => d.id !== id);
    this.set('documents', list);
  }

  // Payments
  getPayments(): Payment[] { return this.get('payments', INITIAL_PAYMENTS); }
  addPayment(payment: Payment) { const list = this.getPayments(); list.push(payment); this.set('payments', list); }
  deletePayment(id: string) {
    const list = this.getPayments().filter(p => p.id !== id);
    this.set('payments', list);
  }

  // Expenses
  getExpenses(): CaseExpense[] { return this.get('expenses', INITIAL_EXPENSES); }
  addExpense(expense: CaseExpense) { const list = this.getExpenses(); list.push(expense); this.set('expenses', list); }
  deleteExpense(id: string) {
    const list = this.getExpenses().filter(e => e.id !== id);
    this.set('expenses', list);
  }

  // Consultations
  getConsultations(): Consultation[] { return this.get('consultations', INITIAL_CONSULTATIONS); }
  addConsultation(consultation: Consultation) { const list = this.getConsultations(); list.push(consultation); this.set('consultations', list); }
  updateConsultation(updated: Consultation) {
    const list = this.getConsultations().map(c => c.id === updated.id ? updated : c);
    this.set('consultations', list);
  }
  deleteConsultation(id: string) {
    const list = this.getConsultations().filter(c => c.id !== id);
    this.set('consultations', list);
  }

  // Settings
  getSettings(): AppSettings { return this.get('settings', INITIAL_SETTINGS); }
  saveSettings(settings: AppSettings) { this.set('settings', settings); }

  // Data Management (Backup/Restore)
  exportDatabase(): string {
    const data = {
      clients: this.getClients(),
      cases: this.getCases(),
      sessions: this.getSessions(),
      tasks: this.getTasks(),
      documents: this.getDocuments(),
      payments: this.getPayments(),
      expenses: this.getExpenses(),
      consultations: this.getConsultations(),
      settings: this.getSettings(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  importDatabase(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.clients) localStorage.setItem('clients', JSON.stringify(data.clients));
      if (data.cases) localStorage.setItem('cases', JSON.stringify(data.cases));
      if (data.sessions) localStorage.setItem('sessions', JSON.stringify(data.sessions));
      if (data.tasks) localStorage.setItem('tasks', JSON.stringify(data.tasks));
      if (data.documents) localStorage.setItem('documents', JSON.stringify(data.documents));
      if (data.payments) localStorage.setItem('payments', JSON.stringify(data.payments));
      if (data.expenses) localStorage.setItem('expenses', JSON.stringify(data.expenses));
      if (data.consultations) localStorage.setItem('consultations', JSON.stringify(data.consultations));
      if (data.settings) localStorage.setItem('settings', JSON.stringify(data.settings));
      this.notifyUpdate();
      return true;
    } catch (e) {
      console.error("Import failed", e);
      return false;
    }
  }

  resetDatabase() {
    localStorage.clear();
    window.location.reload();
  }
}

export const db = new DBService();