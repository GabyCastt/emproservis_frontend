import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExcelService, ArchivoExcel, MisArchivosResponse } from '../../services/excel.service';
import { SolicitudesService } from '../../services/solicitudes.service';
import { AuthService } from '../../services/auth.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-mis-archivos',
  imports: [CommonModule],
  templateUrl: './mis-archivos.component.html',
  styleUrl: './mis-archivos.component.scss'
})
export class MisArchivosComponent implements OnInit {
  private excelService = inject(ExcelService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private solicitudesService = inject(SolicitudesService);

  archivos: ArchivoExcel[] = [];
  loading = false;
  error = '';
  
  // Paginación
  paginaActual = 1;
  limite = 20;
  total = 0;
  totalPaginas = 0;

  // Polling para actualizar estados
  private pollingSubscription?: Subscription;

  // Modal de solicitudes del archivo
  mostrarModalSolicitudes = false;
  solicitudesDelArchivo: any[] = [];
  archivoSeleccionado: ArchivoExcel | null = null;
  estadoDetalladoArchivo: any = null;
  cargandoSolicitudes = false;

  get puedeEliminar(): boolean {
    return this.authService.hasRole(['admin']);
  }

  ngOnInit() {
    this.cargarArchivos();
    this.iniciarPolling();
  }

  ngOnDestroy() {
    this.detenerPolling();
  }

  cargarArchivos() {
    this.loading = true;
    this.error = '';

    this.excelService.misArchivos(this.paginaActual, this.limite).subscribe({
      next: (response: MisArchivosResponse) => {
        this.archivos = response.archivos;
        this.total = response.total;
        this.totalPaginas = Math.ceil(this.total / this.limite);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Error al cargar los archivos';
        this.loading = false;
      }
    });
  }

  iniciarPolling() {
    // Actualizar cada 5 segundos si hay archivos en proceso
    this.pollingSubscription = interval(5000)
      .pipe(
        switchMap(() => this.excelService.misArchivos(this.paginaActual, this.limite))
      )
      .subscribe({
        next: (response: MisArchivosResponse) => {
          // Solo actualizar si hay archivos en proceso
          const hayEnProceso = response.archivos.some(
            a => a.estado === 'procesando' || a.estado === 'pendiente'
          );
          if (hayEnProceso) {
            this.archivos = response.archivos;
            this.total = response.total;
          }
        },
        error: (err) => console.error('Error en polling:', err)
      });
  }

  detenerPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  eliminarArchivo(uploadId: string, nombreArchivo: string) {
    if (!confirm(`¿Estás seguro de eliminar el archivo "${nombreArchivo}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    // Deshabilitar el botón mientras se elimina
    const archivoIndex = this.archivos.findIndex(a => a.id === uploadId);
    if (archivoIndex !== -1) {
      // Marcar como "eliminando" visualmente
      this.archivos[archivoIndex].estado = 'eliminando' as any;
    }

    this.excelService.eliminarArchivo(uploadId).subscribe({
      next: (response) => {
        console.log('Archivo eliminado:', response);
        
        // Eliminar del array local inmediatamente
        this.archivos = this.archivos.filter(a => a.id !== uploadId);
        this.total--;
        
        // Mostrar mensaje de éxito
        this.mostrarMensajeExito(`Archivo "${nombreArchivo}" eliminado correctamente`);
        
        // Recargar la lista completa para asegurar sincronización
        setTimeout(() => {
          this.cargarArchivos();
        }, 500);
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        
        // Restaurar el estado original si falla
        if (archivoIndex !== -1) {
          this.cargarArchivos(); // Recargar para restaurar el estado
        }
        
        let errorMsg = 'Error al eliminar el archivo';
        
        if (err.status === 500) {
          errorMsg = 'Error del servidor al eliminar el archivo.\n\nPosibles causas:\n- El archivo ya no existe en la base de datos\n- Problema con el almacenamiento\n- Error de permisos en el servidor\n\nContacta al administrador si el problema persiste.';
        } else if (err.status === 403) {
          errorMsg = 'No tienes permisos para eliminar este archivo.\nSolo usuarios con rol admin o supervisor pueden eliminar archivos.';
        } else if (err.status === 404) {
          errorMsg = 'El archivo no fue encontrado.\nEs posible que ya haya sido eliminado.';
        } else if (err.error?.detail) {
          errorMsg = err.error.detail;
        }
        
        alert(`Error al eliminar\n\n${errorMsg}`);
      }
    });
  }

  mostrarMensajeExito(mensaje: string) {
    // Crear elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 shadow-lg';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '400px';
    alertDiv.innerHTML = `
      <i class="bi bi-check-circle-fill me-2"></i>
      <strong>¡Éxito!</strong> ${mensaje}
      <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remover después de 4 segundos
    setTimeout(() => {
      alertDiv.classList.remove('show');
      setTimeout(() => alertDiv.remove(), 150);
    }, 4000);
  }

  verDetalles(uploadId: string) {
    const archivo = this.archivos.find(a => a.id === uploadId);
    if (!archivo) return;

    this.archivoSeleccionado = archivo;
    this.mostrarModalSolicitudes = true;
    this.cargandoSolicitudes = true;
    this.solicitudesDelArchivo = [];
    this.estadoDetalladoArchivo = null;

    // Cargar estado detallado del archivo
    this.excelService.obtenerEstado(uploadId).subscribe({
      next: (estado) => {
        console.log('Estado detallado del archivo:', estado);
        this.estadoDetalladoArchivo = estado;
      },
      error: (err) => {
        console.error('Error al obtener estado detallado:', err);
      }
    });

    // Cargar solicitudes del archivo
    console.log('Cargando solicitudes para upload_id:', uploadId);
    this.solicitudesService.listar({
      upload_id: uploadId,
      limite: 100
    }).subscribe({
      next: (response) => {
        console.log(`Solicitudes recibidas: ${response.solicitudes.length}, Esperadas: ${archivo.filas_exitosas}`);
        this.solicitudesDelArchivo = response.solicitudes;
        this.cargandoSolicitudes = false;
      },
      error: (err) => {
        console.error('Error al cargar solicitudes:', err);
        this.cargandoSolicitudes = false;
        this.mostrarAlertaError('Error al cargar las solicitudes del archivo');
      }
    });
  }

  cerrarModalSolicitudes() {
    this.mostrarModalSolicitudes = false;
    this.archivoSeleccionado = null;
    this.solicitudesDelArchivo = [];
    this.estadoDetalladoArchivo = null;
  }

  formatMonto(monto: number): string {
    return new Intl.NumberFormat('es-EC').format(monto);
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

  mostrarAlertaError(mensaje: string) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 shadow-lg';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '400px';
    alertDiv.innerHTML = `
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      ${mensaje}
      <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      alertDiv.classList.remove('show');
      setTimeout(() => alertDiv.remove(), 150);
    }, 4000);
  }

  cambiarPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.cargarArchivos();
  }

  getEstadoClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'completado': 'badge bg-success',
      'procesando': 'badge bg-warning',
      'pendiente': 'badge bg-info',
      'error': 'badge bg-danger',
      'cancelado': 'badge bg-secondary'
    };
    return clases[estado] || 'badge bg-secondary';
  }

  getEstadoTexto(estado: string): string {
    const textos: { [key: string]: string } = {
      'completado': 'Completado',
      'procesando': 'Procesando',
      'pendiente': 'Pendiente',
      'error': 'Error',
      'cancelado': 'Cancelado'
    };
    return textos[estado] || estado;
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-ES');
  }

  formatTamanio(mb: number): string {
    if (mb < 1) return (mb * 1024).toFixed(2) + ' KB';
    return mb.toFixed(2) + ' MB';
  }

  irASubir() {
    this.router.navigate(['/upload']);
  }
}
