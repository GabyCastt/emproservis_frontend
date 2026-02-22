export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expira_en: number;
  usuario: Usuario;
}

export interface Usuario {
  id: string;
  email: string;
  rol: 'admin' | 'supervisor' | 'analista' | 'solo_lectura';
  nombre: string;
}

export interface RefreshRequest {
  refresh_token: string;
}
