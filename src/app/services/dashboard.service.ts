import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardKPIs, TendenciaMensual, RankingAsesor } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  obtenerKPIs(): Observable<DashboardKPIs> {
    return this.http.get<DashboardKPIs>(`${this.apiUrl}/kpis`);
  }

  obtenerTendencias(): Observable<TendenciaMensual[]> {
    return this.http.get<TendenciaMensual[]>(`${this.apiUrl}/tendencias`);
  }

  obtenerRankingAsesores(): Observable<RankingAsesor[]> {
    return this.http.get<RankingAsesor[]>(`${this.apiUrl}/ranking-asesores`);
  }

  obtenerUltimasSolicitudes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ultimas-solicitudes`);
  }
}
