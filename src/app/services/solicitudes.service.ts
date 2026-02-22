import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Solicitud, SolicitudesResponse, CambiarEstadoRequest } from '../models/solicitud.model';

// Interfaces adicionales para los endpoints
export interface KPIs {
  total_solicitudes: number;
  solicitudes_aprobadas: number;
  solicitudes_pendientes: number;
  solicitudes_rechazadas: number;
  monto_total_solicitado: number;
  monto_total_aprobado: number;
  tasa_aprobacion: number;
  ticket_promedio: number;
}

export interface TendenciaMensual {
  mes: string;
  anio: number;
  total_solicitudes: number;
  aprobadas: number;
  rechazadas: number;
  monto_total: number;
}

export interface RankingAsesor {
  asesor_comercial: string;
  total_solicitudes: number;
  aprobadas: number;
  rechazadas: number;
  tasa_aprobacion: number;
  monto_total_aprobado: number;
}

export interface UltimaSolicitud {
  id: string;
  numero_solicitud: string;
  cliente_nombre: string;
  banco_solicitado: string;
  monto_solicitado: number;
  estado: string;
  fecha_solicitud: string;
  asesor_comercial: string;
}

export interface UploadExcelResponse {
  upload_id: string;
  estado: string;
  total_filas: number;
  exitosas: number;
  errores_parseo: number;
  columnas_detectadas: any;
  confianza_parseo: number;
  errores_insercion: string[];
}

export interface EstadoExcel {
  id: string;
  nombre_archivo: string;
  estado: string;
  total_filas: number;
  filas_exitosas: number;
  filas_error: number;
  iniciado_at: string;
  completado_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SolicitudesService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ============================================
  // DASHBOARD - KPIs y Gráficos
  // ============================================

  getKPIs(): Observable<KPIs> {
    return this.http.get<KPIs>(`${this.apiUrl}/dashboard/kpis`);
  }

  getTendencias(): Observable<TendenciaMensual[]> {
    return this.http.get<TendenciaMensual[]>(`${this.apiUrl}/dashboard/tendencias`);
  }

  getRankingAsesores(): Observable<RankingAsesor[]> {
    return this.http.get<RankingAsesor[]>(`${this.apiUrl}/dashboard/ranking-asesores`);
  }

  getUltimasSolicitudes(): Observable<UltimaSolicitud[]> {
    return this.http.get<UltimaSolicitud[]>(`${this.apiUrl}/dashboard/ultimas-solicitudes`);
  }

  // ============================================
  // SOLICITUDES - CRUD
  // ============================================

  listar(filtros?: {
    estado?: string;
    banco?: string;
    asesor?: string;
    pagina?: number;
    limite?: number;
  }): Observable<SolicitudesResponse> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.estado) params = params.set('estado', filtros.estado);
      if (filtros.banco) params = params.set('banco', filtros.banco);
      if (filtros.asesor) params = params.set('asesor', filtros.asesor);
      if (filtros.pagina) params = params.set('pagina', filtros.pagina.toString());
      if (filtros.limite) params = params.set('limite', filtros.limite.toString());
    }
    return this.http.get<SolicitudesResponse>(`${this.apiUrl}/solicitudes`, { params });
  }

  obtenerDetalle(id: string): Observable<Solicitud> {
    return this.http.get<Solicitud>(`${this.apiUrl}/solicitudes/${id}`);
  }

  cambiarEstado(id: string, datos: CambiarEstadoRequest): Observable<Solicitud> {
    return this.http.put<Solicitud>(`${this.apiUrl}/solicitudes/${id}/estado`, datos);
  }

  buscarSolicitudes(texto: string, limite: number = 10): Observable<any> {
    return this.http.post(`${this.apiUrl}/solicitudes/buscar`, {
      texto,
      limite
    });
  }

  // ============================================
  // EXCEL - Upload y Procesamiento
  // ============================================

  subirExcel(file: File): Observable<UploadExcelResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadExcelResponse>(`${this.apiUrl}/excel/upload`, formData);
  }

  obtenerEstadoExcel(uploadId: string): Observable<EstadoExcel> {
    return this.http.get<EstadoExcel>(`${this.apiUrl}/excel/status/${uploadId}`);
  }

  // ============================================
  // REPORTES
  // ============================================

  generarReporte(formato: string = 'json', estado?: string): Observable<any> {
    let params = new HttpParams().set('formato', formato);
    if (estado) params = params.set('estado', estado);
    
    return this.http.get(`${this.apiUrl}/reportes/generar`, { params });
  }
}
