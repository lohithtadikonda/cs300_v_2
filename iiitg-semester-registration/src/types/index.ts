export type UserRole = 'student' | 'warden' | 'finance' | 'student_affairs' | 'academic_affairs' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  rollNo?: string;
  department?: string;
}

export type PaymentCategory = 'loan' | 'scholarship' | 'self_financed';
export type RegistrationCategory = 1 | 2 | 3;

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  department: string;
  semester: number;
}

export type ApprovalStage = 
  | 'draft'
  | 'section_review'
  | 'advisor_review'
  | 'submitted'
  | 'final_approved'
  | 'rejected';

export interface FormA {
  courses: Course[];
  totalCredits: number;
  semester: number;
  academicYear: string;
}

export interface FormB {
  paymentCategory: PaymentCategory;
  tuitionFee: number;
  hostelFee: number;
  otherFees: number;
  totalFee: number;
  lateFine?: number;
  paymentDetails: string;
}

export interface Registration {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  department: string;
  category: RegistrationCategory;
  formA: FormA;
  formB?: FormB;
  currentStage: ApprovalStage;
  remarks: string[];
  approvals: Approval[];
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  stage: ApprovalStage;
  approvedBy: string;
  approvedAt: string;
  remarks?: string;
  status: 'approved' | 'rejected' | 'pending';
}
