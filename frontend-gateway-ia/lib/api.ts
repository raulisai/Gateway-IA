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

export interface RoutingInfo {
  complexity_score: number;
  complexity_level: string;
  model_name: string;
  provider: string;
  reasoning: string;
}

export interface GenerationResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  model_used: string;
  routing_info?: RoutingInfo;
}

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
  user_id: string;
  key_hash: string;
  prefix: string;
  name?: string;
  rate_limit?: number;
  is_active: boolean;
  created_at: string;
  last_used_at?: string;
}

export interface GatewayKeyCreated extends GatewayKey {
  key: string; // Raw key shown only once
}

export interface ProviderKey {
  id: string;
  user_id: string;
  provider: string;
  encrypted_key: string;
  is_active: boolean;
  created_at: string;
  last_verified_at?: string;
}

export interface Model {
  id: string;
  provider: string;
  original_model_id: string;
  name: string;
  description?: string;
  cost_per_1k_input: number;
  cost_per_1k_output: number;
  context_window: number;
  is_active: boolean;
}

export interface RequestLog {
  id: string;
  user_id: string;
  gateway_key_id: string;
  endpoint: string;
  provider: string;
  model: string;
  complexity: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  latency_ms: number;
  cache_hit: number;
  status_code: number;
  error_message?: string;
  created_at: string;
}

export interface AnalyticsOverview {
  total_cost: number;
  total_requests: number;
  avg_latency: number;
  total_tokens: number;
  cache_hit_rate: number;
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

    async create(name?: string, rate_limit?: number): Promise<GatewayKeyCreated> {
      const response = await api.post<GatewayKeyCreated>('/keys', { name, rate_limit });
      return response.data;
    },

    async delete(keyId: string): Promise<void> {
      await api.delete(`/keys/${keyId}`);
    },
  },

  // Provider Keys endpoints
  providerKeys: {
    async list(): Promise<ProviderKey[]> {
      const response = await api.get<ProviderKey[]>('/keys/providers/list');
      return response.data;
    },

    async add(provider: string, api_key: string): Promise<ProviderKey> {
      const response = await api.post<ProviderKey>('/keys/providers/add', {
        provider,
        api_key,
        is_active: true,
      });
      return response.data;
    },

    async delete(keyId: string): Promise<void> {
      await api.delete(`/keys/providers/${keyId}`);
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
    async overview(days: number = 1): Promise<AnalyticsOverview> {
      const response = await api.get<AnalyticsOverview>('/analytics/overview', {
        params: { days },
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
      const response = await api.get<{ model: string; count: number }[]>('/analytics/model-distribution', {
        params: { days },
      });
      // Calculate percentages
      const data = response.data;
      const total = data.reduce((sum, item) => sum + item.count, 0);
      return data.map(item => ({
        model: item.model,
        count: item.count,
        percentage: total > 0 ? (item.count / total) * 100 : 0,
      }));
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
    async complete(params: {
      messages: any[],
      model_id?: string,
      max_tokens?: number,
      temperature?: number
    }): Promise<GenerationResponse> {
      const response = await api.post<GenerationResponse>('/chat/completions', params);
      return response.data;
    },
  },
};

export default api;
