import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface GatewayKey {
  id: string;
  key: string;
  name?: string;
  is_active: boolean;
  created_at: string;
  last_used_at?: string;
}

export interface ProviderKey {
  id: string;
  provider: string;
  key_name?: string;
  is_valid: boolean;
  created_at: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  context_window: number;
  input_cost_per_1k: number;
  output_cost_per_1k: number;
  max_output_tokens: number;
}

export interface RequestLog {
  id: string;
  gateway_key_id: string;
  model_used: string;
  provider: string;
  complexity: string;
  input_tokens: number;
  output_tokens: number;
  cost: number;
  latency_ms: number;
  cached: boolean;
  created_at: string;
}

export interface AnalyticsOverview {
  total_cost: number;
  total_requests: number;
  avg_latency: number;
  cache_rate: number;
  period: string;
}

export interface CostBreakdown {
  date: string;
  model: string;
  cost: number;
  requests: number;
}

export interface ModelDistribution {
  model: string;
  count: number;
  percentage: number;
}

// API Client Methods
export const apiClient = {
  // Auth endpoints
  auth: {
    async login(email: string, password: string): Promise<AuthResponse> {
      const response = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      return response.data;
    },

    async signup(email: string, password: string, full_name?: string): Promise<User> {
      const response = await api.post<User>('/auth/signup', {
        email,
        password,
        full_name,
      });
      return response.data;
    },

    async logout(): Promise<void> {
      await api.post('/auth/logout');
    },

    async getCurrentUser(): Promise<User> {
      const response = await api.get<User>('/auth/me');
      return response.data;
    },
  },

  // Gateway Keys endpoints
  keys: {
    async list(): Promise<GatewayKey[]> {
      const response = await api.get<GatewayKey[]>('/keys');
      return response.data;
    },

    async create(name?: string): Promise<GatewayKey> {
      const response = await api.post<GatewayKey>('/keys', { name });
      return response.data;
    },

    async delete(keyId: string): Promise<void> {
      await api.delete(`/keys/${keyId}`);
    },

    async toggle(keyId: string, is_active: boolean): Promise<GatewayKey> {
      const response = await api.patch<GatewayKey>(`/keys/${keyId}`, { is_active });
      return response.data;
    },
  },

  // Provider Keys endpoints
  providerKeys: {
    async list(): Promise<ProviderKey[]> {
      const response = await api.get<ProviderKey[]>('/keys/providers');
      return response.data;
    },

    async add(provider: string, api_key: string, key_name?: string): Promise<ProviderKey> {
      const response = await api.post<ProviderKey>('/keys/providers', {
        provider,
        api_key,
        key_name,
      });
      return response.data;
    },

    async delete(keyId: string): Promise<void> {
      await api.delete(`/keys/providers/${keyId}`);
    },

    async validate(keyId: string): Promise<{ is_valid: boolean }> {
      const response = await api.post<{ is_valid: boolean }>(`/keys/providers/${keyId}/validate`);
      return response.data;
    },
  },

  // Models endpoints
  models: {
    async list(provider?: string): Promise<Model[]> {
      const response = await api.get<Model[]>('/models', {
        params: provider ? { provider } : undefined,
      });
      return response.data;
    },

    async get(modelId: string): Promise<Model> {
      const response = await api.get<Model>(`/models/${modelId}`);
      return response.data;
    },
  },

  // Analytics endpoints
  analytics: {
    async overview(period: string = '24h'): Promise<AnalyticsOverview> {
      const response = await api.get<AnalyticsOverview>('/analytics/overview', {
        params: { period },
      });
      return response.data;
    },

    async costBreakdown(days: number = 7): Promise<CostBreakdown[]> {
      const response = await api.get<CostBreakdown[]>('/analytics/cost-breakdown', {
        params: { days },
      });
      return response.data;
    },

    async modelDistribution(days: number = 7): Promise<ModelDistribution[]> {
      const response = await api.get<ModelDistribution[]>('/analytics/model-distribution', {
        params: { days },
      });
      return response.data;
    },

    async recentRequests(limit: number = 20, offset: number = 0): Promise<RequestLog[]> {
      const response = await api.get<RequestLog[]>('/analytics/requests', {
        params: { limit, offset },
      });
      return response.data;
    },
  },

  // Gateway Chat endpoint
  chat: {
    async completions(messages: any[], model?: string, temperature?: number): Promise<any> {
      const response = await api.post('/chat/completions', {
        messages,
        model,
        temperature,
      });
      return response.data;
    },
  },
};

export default api;
