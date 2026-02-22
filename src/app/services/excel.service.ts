import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UploadResponse {
  upload_id: string;
  estado: string;
  total_filas: number;
  exitosas: number;
  errores_parseo: number;
  columnas_detectadas: any;
  confianza_parseo: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/excel`;

  subirArchivo(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  obtenerEstado(uploadId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/status/${uploadId}`);
  }
}
