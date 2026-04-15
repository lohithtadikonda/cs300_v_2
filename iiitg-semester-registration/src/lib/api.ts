import { Approval, Course, FormB, PaymentCategory, Registration, RegistrationCategory, User } from '@/types';

const API_BASE_URL = "http://localhost:5000/api";

type RawRecord = Record<string, any>;

export interface CreateRegistrationPayload {
  category: RegistrationCategory;
  formA: {
    courseIds: string[];
    totalCredits: number;
    semester: number;
    academicYear: string;
  };
  formB?: {
    paymentCategory: PaymentCategory;
    tuitionFee: number;
    hostelFee: number;
    otherFees: number;
    totalFee: number;
    lateFine?: number;
    paymentDetails: string;
  };
}

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function readStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  const value = window.localStorage.getItem(key);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getStoredUser() {
  return readStorage<User>('srs_user');
}

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('srs_token');
}

export function setStoredAuth(user: User, token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('srs_user', JSON.stringify(user));
  window.localStorage.setItem('srs_token', token);
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('srs_user');
  window.localStorage.removeItem('srs_token');
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }

  const text = await response.text().catch(() => '');
  return text || null;
}

async function request<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = getStoredToken();

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth();
    }

    const message =
      (typeof payload === 'object' && payload && 'error' in payload && String((payload as RawRecord).error)) ||
      response.statusText ||
      'Request failed';

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

function normalizeUser(raw: RawRecord): User {
  return {
    id: String(raw.id),
    name: raw.name,
    email: raw.email,
    role: raw.role,
    rollNo: raw.rollNo ?? raw.roll_no ?? undefined,
    department: raw.department ?? undefined,
  };
}

function normalizeCourse(raw: RawRecord): Course {
  return {
    id: String(raw.id),
    code: raw.code,
    name: raw.name,
    credits: Number(raw.credits),
    department: raw.department,
    semester: Number(raw.semester),
  };
}

function normalizeApproval(raw: RawRecord): Approval {
  return {
    stage: raw.stage,
    approvedBy: raw.approvedBy ?? raw.approved_by ?? 'System',
    approvedAt: raw.approvedAt ?? raw.approved_at ?? raw.created_at ?? new Date().toISOString(),
    remarks: raw.remarks ?? undefined,
    status: raw.status ?? 'pending',
  };
}

function normalizeFormB(raw?: RawRecord | null): FormB | undefined {
  if (!raw) return undefined;

  return {
    paymentCategory: raw.paymentCategory ?? raw.payment_category,
    tuitionFee: Number(raw.tuitionFee ?? raw.tuition_fee ?? 0),
    hostelFee: Number(raw.hostelFee ?? raw.hostel_fee ?? 0),
    otherFees: Number(raw.otherFees ?? raw.other_fees ?? 0),
    totalFee: Number(raw.totalFee ?? raw.total_fee ?? 0),
    lateFine: raw.lateFine ?? raw.late_fine ? Number(raw.lateFine ?? raw.late_fine ?? 0) : undefined,
    paymentDetails: raw.paymentDetails ?? raw.payment_details ?? '',
  };
}

function normalizeRegistration(raw: RawRecord): Registration {
  const formA = raw.formA ?? raw.form_a ?? {};

  return {
    id: String(raw.id),
    studentId: String(raw.studentId ?? raw.student_id),
    studentName: raw.studentName ?? raw.student_name,
    rollNo: raw.rollNo ?? raw.roll_no,
    department: raw.department,
    category: Number(raw.category) as RegistrationCategory,
    formA: {
      courses: Array.isArray(formA.courses) ? formA.courses.map(normalizeCourse) : [],
      totalCredits: Number(formA.totalCredits ?? formA.total_credits ?? 0),
      semester: Number(formA.semester ?? 0),
      academicYear: formA.academicYear ?? formA.academic_year ?? '',
    },
    formB: normalizeFormB(raw.formB ?? raw.form_b),
    currentStage: raw.currentStage ?? raw.current_stage,
    remarks: Array.isArray(raw.remarks) ? raw.remarks : [],
    approvals: Array.isArray(raw.approvals) ? raw.approvals.map(normalizeApproval) : [],
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
  };
}

export const authApi = {
  async login(email: string, password: string) {
    const result = await request<{ token: string; user: RawRecord }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    return {
      token: result.token,
      user: normalizeUser(result.user),
    };
  },
};

export const coursesApi = {
  async list() {
    const result = await request<RawRecord[]>('/courses');
    return result.map(normalizeCourse);
  },
};

export const registrationsApi = {
  async getMy() {
    const result = await request<RawRecord[]>('/registrations/my');
    return result.map(normalizeRegistration);
  },

  async getAll() {
    const result = await request<RawRecord[]>('/registrations/all');
    return result.map(normalizeRegistration);
  },

  async create(payload: CreateRegistrationPayload) {
    return request<{ id: string; message: string; currentStage: string }>('/registrations', {
      method: 'POST',
      body: JSON.stringify({
        category: String(payload.category),
        formA: payload.formA,
        formB: payload.formB,
      }),
    });
  },

  async approve(id: string, status: 'approved' | 'rejected', remarks?: string) {
    return request<{ message: string }>(`/registrations/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ status, remarks }),
    });
  },
};

export const adminApi = {
  async getSettings() {
    return request<Record<string, any>>('/admin/settings');
  },

  async updateSetting(key: string, value: unknown) {
    return request<{ message: string }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    });
  },

  async getUsers() {
    const result = await request<RawRecord[]>('/admin/users');
    return result.map(normalizeUser);
  },
};