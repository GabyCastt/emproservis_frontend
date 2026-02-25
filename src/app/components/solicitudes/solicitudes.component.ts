import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SolicitudesService } from '../../services/solicitudes.service';
import { AuthService } from '../../services/auth.service';
import { Solicitud } from '../../models/solicitud.model';

@Component({
  selector: 'app-solicitudes',
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitudes.component.html',
  styleUrl: './solicitudes.component.scss'
})
export class SolicitudesComponent implements OnInit {
  private solicitudesService = inject(SolicitudesService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  solicitudes: Solicitud[] = [];
  loading = true;
  paginaActual = 1;
  limite = 20;
  filtroEstado = '';
  filtroAsesor = '';
  filtroCliente = '';
  filtroUploadId = '';
  nombreArchivoFiltrado = '';

  // Modal de detalle
  solicitudSeleccionada: Solicitud | null = null;
  mostrarModalDetalle = false;

  // Modal de cambio de estado
  mostrarModalCambioEstado = false;
  solicitudParaCambioEstado: Solicitud | null = null;
  nuevoEstado = '';
  motivoRechazo = '';
  observaciones = '';
  cambiandoEstado = false;

  // Búsqueda
  textoBusqueda = '';
  buscando = false;

  // Permisos
  get puedeCambiarEstado(): boolean {
    return this.authService.hasRole(['admin', 'supervisor']);
  }

  get puedeSubirExcel(): boolean {
    return this.authService.hasRole(['admin', 'analista', 'supervisor']);
  }

  get puedeGenerarReportes(): boolean {
    return this.authService.hasRole(['admin', 'supervisor', 'analista']);
  }

  ngOnInit() {
    // Leer query params para filtrar por archivo
    this.route.queryParams.subscribe(params => {
      if (params['upload_id']) {
        this.filtroUploadId = params['upload_id'];
        this.nombreArchivoFiltrado = params['archivo'] || '';
      }
      this.cargarSolicitudes();
    });
  }

  cargarSolicitudes() {
    this.loading = true;
    
    // Filtrar localmente por nombre de cliente si hay filtro
    this.solicitudesService.listar({
      estado: this.filtroEstado || undefined,
      asesor: this.filtroAsesor || undefined,
      upload_id: this.filtroUploadId || undefined,
      pagina: this.paginaActual,
      limite: this.limite
    }).subscribe({
      next: (response) => {
        let solicitudes = response.solicitudes;
        
        // Filtrar por nombre de cliente localmente
        if (this.filtroCliente) {
          const filtroLower = this.filtroCliente.toLowerCase();
          solicitudes = solicitudes.filter(sol => {
            if (sol.clientes) {
              const nombreCompleto = `${sol.clientes.nombres} ${sol.clientes.apellidos}`.toLowerCase();
              return nombreCompleto.includes(filtroLower);
            }
            return false;
          });
        }
        
        this.solicitudes = solicitudes;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar solicitudes:', err);
        this.loading = false;
      }
    });
  }

  limpiarFiltros() {
    this.filtroEstado = '';
    this.filtroAsesor = '';
    this.filtroCliente = '';
    this.filtroUploadId = '';
    this.nombreArchivoFiltrado = '';
    this.paginaActual = 1;
    // Limpiar query params
    this.router.navigate(['/solicitudes']);
    this.cargarSolicitudes();
  }

  aplicarFiltros() {
    this.paginaActual = 1;
    this.cargarSolicitudes();
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.cargarSolicitudes();
    }
  }

  paginaSiguiente() {
    this.paginaActual++;
    this.cargarSolicitudes();
  }

  formatMonto(monto: number): string {
    return new Intl.NumberFormat('es-EC').format(monto);
  }

  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-EC');
  }

  formatEstado(estado: string): string {
    const estados: any = {
      'pendiente': 'Pendiente',
      'en_revision': 'En Revisión',
      'aprobada': 'Aprobada',
      'rechazada': 'Rechazada',
      'en_proceso': 'En Proceso',
      'desembolsada': 'Desembolsada',
      'cancelada': 'Cancelada'
    };
    return estados[estado] || estado;
  }

  getBadgeClass(estado: string): string {
    const classes: any = {
      'pendiente': 'bg-warning',
      'en_revision': 'bg-info',
      'aprobada': 'bg-success',
      'rechazada': 'bg-danger',
      'en_proceso': 'bg-primary',
      'desembolsada': 'bg-success',
      'cancelada': 'bg-secondary'
    };
    return classes[estado] || 'bg-secondary';
  }

  volver() {
    this.router.navigate(['/dashboard']);
  }

  // Ver detalle de solicitud
  verDetalle(solicitudId: string) {
    this.solicitudesService.obtenerDetalle(solicitudId).subscribe({
      next: (solicitud) => {
        this.solicitudSeleccionada = solicitud;
        this.mostrarModalDetalle = true;
      },
      error: (err) => {
        console.error('Error al obtener detalle:', err);
        this.mostrarAlertaError('Error al cargar el detalle de la solicitud');
      }
    });
  }

  cerrarModalDetalle() {
    this.mostrarModalDetalle = false;
    this.solicitudSeleccionada = null;
  }

  // Buscar solicitudes
  buscar() {
    if (!this.textoBusqueda || this.textoBusqueda.trim().length < 3) {
      this.mostrarAlertaAdvertencia('Ingresa al menos 3 caracteres para buscar');
      return;
    }

    this.buscando = true;
    this.solicitudesService.buscarSolicitudes(this.textoBusqueda.trim(), 20).subscribe({
      next: (response) => {
        this.solicitudes = response.resultados || response;
        this.buscando = false;
        if (this.solicitudes.length === 0) {
          this.mostrarAlertaInfo('No se encontraron solicitudes con ese criterio de búsqueda');
        }
      },
      error: (err) => {
        console.error('Error al buscar:', err);
        this.buscando = false;
        this.mostrarAlertaError('Error al realizar la búsqueda');
      }
    });
  }

  // Generar reporte
  generarReporte(formato: string = 'json') {
    const estado = this.filtroEstado || undefined;
    
    this.solicitudesService.generarReporte(formato, estado).subscribe({
      next: (response) => {
        if (formato === 'json') {
          // Descargar como JSON
          const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
          this.descargarArchivo(blob, `reporte-solicitudes-${new Date().getTime()}.json`);
        } else {
          // Para otros formatos, el backend debería devolver el archivo
          this.mostrarAlertaExito('Reporte generado exitosamente');
        }
      },
      error: (err) => {
        console.error('Error al generar reporte:', err);
        this.mostrarAlertaError('Error al generar el reporte');
      }
    });
  }

  descargarArchivo(blob: Blob, nombreArchivo: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Alertas con Bootstrap
  mostrarAlertaExito(mensaje: string) {
    this.mostrarAlerta(mensaje, 'success', 'check-circle-fill');
  }

  mostrarAlertaError(mensaje: string) {
    this.mostrarAlerta(mensaje, 'danger', 'exclamation-triangle-fill');
  }

  mostrarAlertaAdvertencia(mensaje: string) {
    this.mostrarAlerta(mensaje, 'warning', 'exclamation-circle-fill');
  }

  mostrarAlertaInfo(mensaje: string) {
    this.mostrarAlerta(mensaje, 'info', 'info-circle-fill');
  }

  private mostrarAlerta(mensaje: string, tipo: string, icono: string) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 shadow-lg`;
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '400px';
    alertDiv.innerHTML = `
      <i class="bi bi-${icono} me-2"></i>
      ${mensaje}
      <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      alertDiv.classList.remove('show');
      setTimeout(() => alertDiv.remove(), 150);
    }, 4000);
  }

  // Cambiar estado de solicitud
  abrirModalCambioEstado(solicitud: Solicitud) {
    if (!this.puedeCambiarEstado) {
      this.mostrarAlertaAdvertencia('No tienes permisos para cambiar el estado de solicitudes. Solo admin y supervisor pueden realizar esta acción.');
      return;
    }

    this.solicitudParaCambioEstado = solicitud;
    this.nuevoEstado = solicitud.estado;
    this.motivoRechazo = '';
    this.observaciones = '';
    this.mostrarModalCambioEstado = true;
  }

  cerrarModalCambioEstado() {
    this.mostrarModalCambioEstado = false;
    this.solicitudParaCambioEstado = null;
    this.nuevoEstado = '';
    this.motivoRechazo = '';
    this.observaciones = '';
  }

  confirmarCambioEstado() {
    if (!this.solicitudParaCambioEstado) return;

    // Validar que se haya seleccionado un estado
    if (!this.nuevoEstado) {
      this.mostrarAlertaAdvertencia('Debes seleccionar un estado');
      return;
    }

    // Validar motivo de rechazo si el estado es rechazada
    if (this.nuevoEstado === 'rechazada' && !this.motivoRechazo.trim()) {
      this.mostrarAlertaAdvertencia('El motivo de rechazo es obligatorio cuando se rechaza una solicitud');
      return;
    }

    this.cambiandoEstado = true;

    this.solicitudesService.cambiarEstado(this.solicitudParaCambioEstado.id, {
      estado: this.nuevoEstado,
      motivo_rechazo: this.motivoRechazo.trim() || undefined,
      observaciones: this.observaciones.trim() || undefined
    }).subscribe({
      next: (solicitudActualizada) => {
        this.mostrarAlertaExito(`Estado cambiado exitosamente a "${this.formatEstado(solicitudActualizada.estado)}"`);
        this.cambiandoEstado = false;
        this.cerrarModalCambioEstado();
        this.cargarSolicitudes();
      },
      error: (err) => {
        console.error('Error al cambiar estado:', err);
        this.mostrarAlertaError(err.error?.detail || 'Error al cambiar el estado de la solicitud');
        this.cambiandoEstado = false;
      }
    });
  }
}
