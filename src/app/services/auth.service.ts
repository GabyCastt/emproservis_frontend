import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, Usuario, RefreshRequest } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private currentUserSubject = new BehaviorSubject<Usuario | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private getUserFromStorage(): Usuario | null {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('usuario');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.setSession(response);
        }),
        catchError(error => {
          console.error('Error en login:', error);
          return throwError(() => error);
        })
      );
  }

  private setSession(response: LoginResponse): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('usuario', JSON.stringify(response.usuario));
      
      // Configurar auto-refresh del token antes de que expire
      const expiresIn = response.expira_en || 3600;
      this.scheduleTokenRefresh(expiresIn);
    }
    this.currentUserSubject.next(response.usuario);
  }

  private scheduleTokenRefresh(expiresIn: number): void {
    // Refrescar el token 5 minutos antes de que expire
    const refreshTime = (expiresIn - 300) * 1000;
    setTimeout(() => {
      this.refreshToken().subscribe({
        error: () => this.logout()
      });
    }, refreshTime);
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refresh_token') 
      : null;
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<LoginResponse>(
      `${environment.apiUrl}/auth/refresh`, 
      { refresh_token: refreshToken } as RefreshRequest
    ).pipe(
      tap(response => {
        this.setSession(response);
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({
        error: (err) => console.error('Error al cerrar sesión:', err)
      });
    }
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('usuario');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  hasRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.rol) : false;
  }

  isAdmin(): boolean {
    return this.hasRole(['admin']);
  }

  canUploadExcel(): boolean {
    return this.hasRole(['admin', 'analista', 'supervisor']);
  }

  canChangeStatus(): boolean {
    return this.hasRole(['admin', 'supervisor']);
  }
}
