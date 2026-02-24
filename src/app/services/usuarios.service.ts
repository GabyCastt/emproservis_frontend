import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RegistroRequest {
  email: string;
  password: string;
  nombre_completo: string;
  rol: 'admin' | 'supervisor' | 'analista' | 'solo_lectura';
}

export interface ActualizarUsuarioRequest {
  nombre_completo?: string;
  rol?: string;
  activo?: boolean;
}

export interface Usuario {
  id: string;
  email: string;
  nombre_completo: string;
  rol: string;
  activo: boolean;
  created_at: string;
  ultimo_login: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  registrarUsuario(datos: RegistroRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, datos);
  }

  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`);
  }

  actualizarUsuario(usuarioId: string, datos: ActualizarUsuarioRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${usuarioId}`, datos);
  }

  desactivarUsuario(usuarioId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${usuarioId}`);
  }
}
