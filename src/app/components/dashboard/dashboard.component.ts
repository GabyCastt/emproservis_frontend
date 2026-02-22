import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardKPIs, TendenciaMensual, RankingAsesor, TendenciaAgrupada } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  kpis: DashboardKPIs | null = null;
  tendencias: TendenciaMensual[] = [];
  tendenciasAgrupadas: TendenciaAgrupada[] = [];
  rankingAsesores: RankingAsesor[] = [];
  ultimasSolicitudes: any[] = [];
  
  loading = true;
  loadingTendencias = true;
  loadingRanking = true;
  loadingUltimas = true;

  // Estadísticas adicionales
  bancosMasUsados: { banco: string; total: number; tasa: number }[] = [];

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // Cargar KPIs
    this.dashboardService.obtenerKPIs().subscribe({
      next: (data) => {
        this.kpis = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar KPIs:', err);
        this.loading = false;
      }
    });

    // Cargar tendencias
    this.dashboardService.obtenerTendencias().subscribe({
      next: (data) => {
        this.tendencias = data;
        this.procesarTendencias(data);
        this.calcularBancosMasUsados(data);
        this.loadingTendencias = false;
      },
      error: (err) => {
        console.error('Error al cargar tendencias:', err);
        this.loadingTendencias = false;
      }
    });

    // Cargar ranking de asesores
    this.dashboardService.obtenerRankingAsesores().subscribe({
      next: (data) => {
        // Filtrar datos inválidos
        const estadosInvalidos = ['pendiente', 'aprobada', 'rechazada', 'en_revision', 'en_proceso', 'desembolsada', 'cancelada', ''];
        
        this.rankingAsesores = data
          .filter(asesor => {
            const nombreValido = asesor.asesor_comercial && 
                                !estadosInvalidos.includes(asesor.asesor_comercial.toLowerCase().trim());
            const tieneAprobadas = asesor.aprobadas > 0;
            return nombreValido && tieneAprobadas;
          })
          .sort((a, b) => {
            const tasaA = a.tasa_exito || a.tasa_aprobacion || 0;
            const tasaB = b.tasa_exito || b.tasa_aprobacion || 0;
            return tasaB - tasaA;
          })
          .slice(0, 10);
        
        this.loadingRanking = false;
      },
      error: (err) => {
        console.error('Error al cargar ranking:', err);
        this.loadingRanking = false;
      }
    });

    // Cargar últimas solicitudes
    this.dashboardService.obtenerUltimasSolicitudes().subscribe({
      next: (data) => {
        this.ultimasSolicitudes = data.slice(0, 10);
        this.loadingUltimas = false;
      },
      error: (err) => {
        console.error('Error al cargar últimas solicitudes:', err);
        this.loadingUltimas = false;
      }
    });
  }

  procesarTendencias(data: TendenciaMensual[]) {
    // Agrupar por mes
    const mesesMap = new Map<string, TendenciaAgrupada>();

    data.forEach(item => {
      const mesKey = this.formatearMesKey(item.mes);
      
      if (!mesesMap.has(mesKey)) {
        mesesMap.set(mesKey, {
          mes: mesKey,
          total: 0,
          aprobadas: 0,
          rechazadas: 0,
          pendientes: 0,
          tasa_aprobacion: 0,
          bancos: {}
        });
      }

      const tendencia = mesesMap.get(mesKey)!;
      tendencia.total += item.total;
      tendencia.aprobadas += item.aprobadas;
      tendencia.rechazadas += item.rechazadas;
      tendencia.pendientes += item.pendientes;

      // Agregar datos por banco
      tendencia.bancos[item.banco_solicitado] = {
        total: item.total,
        aprobadas: item.aprobadas,
        rechazadas: item.rechazadas
      };
    });

    // Calcular tasa de aprobación y ordenar
    this.tendenciasAgrupadas = Array.from(mesesMap.values())
      .map(t => ({
        ...t,
        tasa_aprobacion: t.total > 0 ? (t.aprobadas / t.total) * 100 : 0
      }))
      .sort((a, b) => new Date(b.mes).getTime() - new Date(a.mes).getTime())
      .slice(0, 12); // Últimos 12 meses
  }

  calcularBancosMasUsados(data: TendenciaMensual[]) {
    const bancosMap = new Map<string, { total: number; aprobadas: number }>();

    data.forEach(item => {
      if (!bancosMap.has(item.banco_solicitado)) {
        bancosMap.set(item.banco_solicitado, { total: 0, aprobadas: 0 });
      }
      const banco = bancosMap.get(item.banco_solicitado)!;
      banco.total += item.total;
      banco.aprobadas += item.aprobadas;
    });

    this.bancosMasUsados = Array.from(bancosMap.entries())
      .map(([banco, stats]) => ({
        banco,
        total: stats.total,
        tasa: stats.total > 0 ? (stats.aprobadas / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5); // Top 5 bancos
  }

  formatearMesKey(fecha: string): string {
    const date = new Date(fecha);
    return date.toISOString().substring(0, 7); // YYYY-MM
  }

  formatearMesNombre(mesKey: string): string {
    const [year, month] = mesKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-EC', { year: 'numeric', month: 'short' });
  }

  formatMonto(monto: number | null): string {
    if (!monto) return '0';
    return new Intl.NumberFormat('es-EC').format(monto);
  }

  formatMoneda(monto: number | null): string {
    if (!monto) return '$0';
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(monto);
  }

  formatPorcentaje(valor: number): string {
    if (!valor && valor !== 0) return '0.0%';
    return `${valor.toFixed(1)}%`;
  }

  getTasaAsesor(asesor: RankingAsesor): number {
    return asesor.tasa_exito || asesor.tasa_aprobacion || 0;
  }

  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getEstadoClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'aprobada': 'badge bg-success',
      'pendiente': 'badge bg-warning text-dark',
      'rechazada': 'badge bg-danger',
      'en_revision': 'badge bg-info',
      'en_proceso': 'badge bg-primary',
      'desembolsada': 'badge bg-success',
      'cancelada': 'badge bg-secondary'
    };
    return clases[estado] || 'badge bg-secondary';
  }

  getEstadoTexto(estado: string): string {
    const textos: { [key: string]: string } = {
      'aprobada': 'Aprobada',
      'pendiente': 'Pendiente',
      'rechazada': 'Rechazada',
      'en_revision': 'En Revisión',
      'en_proceso': 'En Proceso',
      'desembolsada': 'Desembolsada',
      'cancelada': 'Cancelada'
    };
    return textos[estado] || estado;
  }

  getProgressWidth(valor: number, total: number): number {
    return total > 0 ? (valor / total) * 100 : 0;
  }

  irASolicitudes() {
    this.router.navigate(['/solicitudes']);
  }

  irAUpload() {
    this.router.navigate(['/upload']);
  }

  verSolicitud(id: string) {
    this.router.navigate(['/solicitudes', id]);
  }
}

