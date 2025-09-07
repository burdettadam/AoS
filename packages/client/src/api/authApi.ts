import { useKeycloak } from '../context/KeycloakContext';

export class AuthenticatedApi {
  private static getAuthHeaders(token: string | null): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  static async fetch(
    url: string, 
    options: RequestInit = {}, 
    token: string | null = null
  ): Promise<Response> {
    const authHeaders = this.getAuthHeaders(token);
    
    return fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    });
  }

  static async get(url: string, token: string | null = null): Promise<Response> {
    return this.fetch(url, { method: 'GET' }, token);
  }

  static async post(
    url: string, 
    body: any, 
    token: string | null = null
  ): Promise<Response> {
    return this.fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
    }, token);
  }

  static async put(
    url: string, 
    body: any, 
    token: string | null = null
  ): Promise<Response> {
    return this.fetch(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, token);
  }

  static async delete(url: string, token: string | null = null): Promise<Response> {
    return this.fetch(url, { method: 'DELETE' }, token);
  }
}

// Hook to get authenticated API instance
export const useAuthenticatedApi = () => {
  const { token } = useKeycloak();
  
  return {
    get: (url: string) => AuthenticatedApi.get(url, token),
    post: (url: string, body: any) => AuthenticatedApi.post(url, body, token),
    put: (url: string, body: any) => AuthenticatedApi.put(url, body, token),
    delete: (url: string) => AuthenticatedApi.delete(url, token),
  };
};
