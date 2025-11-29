
export enum ClientType {
  Individual = 'individual',
  Company = 'company'
}

export interface Client {
  id: string;
  name: string;
  type: ClientType;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export enum CaseStatus {
  UnderFiling = 'under_filing',
  Active = 'active',
  Execution = 'execution',
  Closed = 'closed'
}

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  clientId: string;
  opponentName: string;
  court: string;
  department: string;
  status: CaseStatus;
  financialTotal: number;
  financialPaid: number;
  openedDate: string;
  judgmentDate?: string;
  verdict?: string; // منطوق الحكم
}

export enum SessionStatus {
  Upcoming = 'upcoming',
  Completed = 'completed'
}

export interface Session {
  id: string;
  caseId: string;
  sessionDate: string; // YYYY-MM-DD
  sessionType: string;
  notes: string;
  judgeName: string;
  status: SessionStatus;
  nextSessionId?: string;
}

export enum TaskPriority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low'
}

export enum TaskStatus {
  Pending = 'Pending',
  Done = 'Done'
}

export interface Task {
  id: string;
  title: string;
  assignee: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  caseId?: string; // Optional link to a case
}

export interface CaseDocument {
  id: string;
  caseId: string;
  title: string;
  type: 'pdf' | 'image' | 'word' | 'other';
  uploadDate: string;
  url?: string;
}

export interface Payment {
  id: string;
  caseId: string;
  amount: number;
  date: string;
  note: string;
}

export interface CaseExpense {
  id: string;
  caseId: string;
  amount: number;
  date: string;
  title: string;
  category: 'court_fee' | 'expert' | 'transport' | 'other';
}

export interface Consultation {
  id: string;
  clientId: string;
  date: string;
  topic: string;
  price: number;
  isPaid: boolean;
  notes: string;
}

export interface AppSettings {
  officeName: string;
  lawyerName: string;
  printHeader: string;
  printFooter: string;
  country: string;
  currency: string;
}