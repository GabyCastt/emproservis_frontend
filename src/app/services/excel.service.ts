import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UploadResponse {
  upload_id: string;
  estado: string;
  archivo_guardado_en: string;
  total_filas: number;
  exitosas: number;
  errores_parseo: number;
  columnas_detectadas: any;
  confianza_parseo: number;
  errores_insercion: string[];
}

export interface ArchivoExcel {
  id: string;
  nombre_archivo: string;
  storage_path: string;
  estado: string;
  total_filas: number;
  filas_exitosas: number;
  filas_error: number;
  filas_duplicadas: number;
  tamanio_bytes: number;
  tamanio_mb: number;
  created_at: string;
  iniciado_at: string;
  completado_at: string;
  subido_por: string;
  error_mensaje: string;
  url_descarga: string;
  profiles?: {
    nombre_completo: string;
    email: string;
  };
}

export interface MisArchivosResponse {
  pagina: number;
  limite: number;
  total: number;
  archivos: ArchivoExcel[];
}

export interface InspeccionExcel {
  veredicto: string;
  problemas_criticos: any[];
  advertencias: any[];
  resumen: {
    archivo: string;
    fila_encabezado_detectada: number;
    total_filas_raw_en_excel: number;
    total_columnas_raw: number;
    filas_de_datos: number;
    filas_parseadas_ok: number;
    filas_vacias_omitidas: number;
    filas_total_suma_omitidas: number;
    filas_con_error: number;
    confianza_mapeo_columnas: number;
  };
  columnas: {
    originales_en_excel: string[];
    mapeadas_correctamente: any;
    no_mapeadas: string[];
    colisiones_detectadas: any[];
    campos_faltantes_en_excel: string[];
  };
  completitud_por_campo: any;
}

export interface PreviewFilas {
  archivo: string;
  total_filas_mostradas: number;
  filas: any[];
}

export interface TrazaColumna {
  columna_buscada: string;
  encontrada: boolean;
  razon: string;
  detalles: any;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/excel`;
  private debugUrl = `${environment.apiUrl}/excel-debug`;

  subirArchivo(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  obtenerEstado(uploadId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/status/${uploadId}`);
  }

  misArchivos(pagina: number = 1, limite: number = 20): Observable<MisArchivosResponse> {
    const params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());
    return this.http.get<MisArchivosResponse>(`${this.apiUrl}/mis-archivos`, { params });
  }

  eliminarArchivo(uploadId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar/${uploadId}`);
  }

  // Endpoints de debug para inspeccionar archivos antes de subirlos
  inspeccionarArchivo(file: File): Observable<InspeccionExcel> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<InspeccionExcel>(`${this.debugUrl}/inspeccionar`, formData);
  }

  previewPrimerasFilas(file: File, n: number = 20): Observable<PreviewFilas> {
    const formData = new FormData();
    formData.append('file', file);
    const params = new HttpParams().set('n', n.toString());
    return this.http.post<PreviewFilas>(`${this.debugUrl}/preview-primeras-filas`, formData, { params });
  }

  trazarColumna(file: File, nombreColumna: string): Observable<TrazaColumna> {
    const formData = new FormData();
    formData.append('file', file);
    const params = new HttpParams().set('nombre_columna', nombreColumna);
    return this.http.post<TrazaColumna>(`${this.debugUrl}/trazar-columna`, formData, { params });
  }
}
