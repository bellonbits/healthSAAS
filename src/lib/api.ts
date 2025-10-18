import axios from 'axios';

export interface DashboardStats {
  total_patients: number;
  total_households: number;
  total_visits: number;
  high_risk_patients: number;
  recent_visits_count: number;
  patients_trend: number;
  households_trend: number;
  visits_trend: number;
  risk_distribution?: { // Make this optional
    Low: number;
    Medium: number;
    High: number;
  };
}

export interface Household {
  _id: string;
  code: string;
  location: string;
  head_name: string;
  phone?: string;
  created_by: string;
  created_at: string;
}

export interface Patient {
  _id: string;
  household_id: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
  phone?: string;
  medical_condition?: string;
  risk_level: 'Low' | 'Medium' | 'High';
  created_at: string;
  last_visit?: string;
}

export interface Visit {
  _id: string;
  patient_id: string;
  household_id?: string; // Add this as optional
  patient_name?: string;
  visit_date: string;
  visit_type?: string; // Also make this optional since it's used in the form
  blood_pressure?: string;
  temperature?: string;
  heart_rate?: string;
  respiratory_rate?: string;
  oxygen_saturation?: string;
  symptoms?: string;
  diagnosis?: string;
  medication?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  notes?: string;
  created_at: string;
  ai_recommendation?: any;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Activity {
  _id: string;
  description: string;
  type: string;
  user_id: string;
  user_name: string;
  timestamp: string;
}

export interface AIRecommendation {
  possible_diagnosis: string;
  follow_up_action: string;
  risk_level: string;
  advice: string;
}

export interface RecentActivity {
  _id: string;
  type: 'patient_created' | 'household_created' | 'visit_created' | 'patient_updated' | 'visit_updated' | 'user_logged_in' | 'data_exported';
  description: string;
  user: string;
  user_id: string;
  timestamp: string;
  metadata?: {
    patient_name?: string;
    patient_id?: string;
    household_code?: string;
    household_id?: string;
    visit_type?: string;
    visit_id?: string;
  };
}

export interface ApiError {
  detail: string | Array<{ loc: string[]; msg: string; type: string }>;
}

const API_BASE_URL = 'http://4.222.216.225:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('healthsaas_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('healthsaas_user');
      localStorage.removeItem('healthsaas_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function to extract error message
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === 'string') {
      return detail;
    } else if (Array.isArray(detail)) {
      // Handle validation errors array
      return detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
    }
  }
  return error.message || 'An unexpected error occurred';
};

export const api = {
  // Health check
  health: () => apiClient.get('/api/health'),

  // Auth
  login: (email: string, password: string) => 
    apiClient.post('/api/users/login', null, { 
      params: { email, password }
    }),
  
  register: (data: any) => 
    apiClient.post('/api/users/register', data),

  // Users
  getUsers: () => 
    apiClient.get('/api/users'),
  
  updateUser: (id: string, data: any) =>
    apiClient.put(`/api/users/${id}`, data),

  deleteUser: (id: string) =>
    apiClient.delete(`/api/users/${id}`),

  // Dashboard
  getDashboardStats: () => apiClient.get('/api/analytics/dashboard'),
  getRecentActivity: () => apiClient.get('/api/analytics/recent-activity'),

  // Households
  getHouseholds: (params?: any) => 
    apiClient.get('/api/households', { params }),

  createHousehold: (data: any) => 
    apiClient.post('/api/households', data),

  getHousehold: (id: string) => 
    apiClient.get(`/api/households/${id}`),

  updateHousehold: (id: string, data: any) => 
    apiClient.put(`/api/households/${id}`, data),

  deleteHousehold: (id: string) => 
    apiClient.delete(`/api/households/${id}`),

  searchHouseholds: (query: string) => 
    apiClient.get('/api/households/search', { params: { q: query } }),

  getHouseholdStatistics: () => 
    apiClient.get('/api/households/statistics'),

  // Patients
  getPatients: (params?: any) => 
    apiClient.get('/api/patients', { params }),

  createPatient: (data: any) => 
    apiClient.post('/api/patients', data),

  getPatient: (id: string) => 
    apiClient.get(`/api/patients/${id}`),

  updatePatient: (id: string, data: any) => 
    apiClient.put(`/api/patients/${id}`, data),

  deletePatient: (id: string) => 
    apiClient.delete(`/api/patients/${id}`),

  importPatientsCSV: (data: FormData) => 
    apiClient.post('/api/patients/import-csv', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  downloadCSVTemplate: () => 
    apiClient.get('/api/patients/csv-template', { responseType: 'blob' }),

  // Visits
  getVisits: (params?: any) => 
    apiClient.get('/api/visits', { params }),

  createVisit: (data: any) => 
    apiClient.post('/api/visits', data),

  // ADD THE MISSING updateVisit METHOD
  updateVisit: (id: string, data: any) => 
    apiClient.put(`/api/visits/${id}`, data),

  getVisit: (id: string) => 
    apiClient.get(`/api/visits/${id}`),

  deleteVisit: (id: string) => 
    apiClient.delete(`/api/visits/${id}`),

  // AI
  getAIHealthRecommendation: (data: any) => 
    apiClient.post('/api/ai/health-recommendation', data),

  getAIStatus: () => 
    apiClient.get('/api/ai/status'),
};

export const generateMockActivities = (): RecentActivity[] => {
  const activities: RecentActivity[] = [
    {
      _id: '1',
      type: 'patient_created',
      description: 'New patient registered',
      user: 'Dr. Sarah Johnson',
      user_id: 'user1',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
      metadata: {
        patient_name: 'John Kamau',
        patient_id: 'patient123'
      }
    },
    {
      _id: '2',
      type: 'visit_created',
      description: 'Medical visit recorded',
      user: 'Nurse Mary Wanjiku',
      user_id: 'user2',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      metadata: {
        patient_name: 'Jane Wambui',
        visit_type: 'Routine Checkup'
      }
    },
    {
      _id: '3',
      type: 'household_created',
      description: 'New household registered',
      user: 'CHW Peter Omondi',
      user_id: 'user3',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      metadata: {
        household_code: 'HH-015',
        household_id: 'household123'
      }
    },
    {
      _id: '4',
      type: 'patient_updated',
      description: 'Patient information updated',
      user: 'Dr. Sarah Johnson',
      user_id: 'user1',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
      metadata: {
        patient_name: 'Michael Otieno',
        patient_id: 'patient456'
      }
    },
    {
      _id: '5',
      type: 'visit_created',
      description: 'Emergency visit recorded',
      user: 'Dr. Sarah Johnson',
      user_id: 'user1',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
      metadata: {
        patient_name: 'Grace Achieng',
        visit_type: 'Emergency'
      }
    },
    {
      _id: '6',
      type: 'user_logged_in',
      description: 'User logged into system',
      user: 'Admin User',
      user_id: 'admin1',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    },
    {
      _id: '7',
      type: 'data_exported',
      description: 'Data export completed',
      user: 'Dr. Sarah Johnson',
      user_id: 'user1',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    }
  ];
  return activities;
};

// Add this function to your api.ts file
export const getFallbackHealthRecommendation = (patientData: any) => {
  const conditions = patientData.medical_condition?.toLowerCase() || '';
  const riskLevel = patientData.risk_level || 'Low';
  
  const fallbackRecommendations: { [key: string]: string } = {
    'diabetes': `Based on standard protocols for ${riskLevel.toLowerCase()} risk diabetes patients: Monitor blood sugar levels regularly, maintain balanced diet, and follow up in 2 weeks.`,
    'hypertension': `For ${riskLevel.toLowerCase()} risk hypertension: Continue prescribed medication, monitor blood pressure daily, reduce sodium intake, and schedule follow-up in 1 month.`,
    'asthma': `Asthma management for ${riskLevel.toLowerCase()} risk: Use inhaler as prescribed, avoid triggers, and seek immediate care for breathing difficulties.`,
    'default': `General health advice: Maintain regular check-ups, follow prescribed treatments, and contact healthcare provider for any concerns. Risk level: ${riskLevel}.`
  };

  if (conditions.includes('diabetes')) {
    return fallbackRecommendations.diabetes;
  } else if (conditions.includes('hypertension') || conditions.includes('high blood pressure')) {
    return fallbackRecommendations.hypertension;
  } else if (conditions.includes('asthma')) {
    return fallbackRecommendations.asthma;
  } else {
    return fallbackRecommendations.default;
  }
};

export default api;