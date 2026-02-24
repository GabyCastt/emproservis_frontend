import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExcelService, ArchivoExcel, MisArchivosResponse } from '../../services/excel.service';
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

  get puedeEliminar(): boolean {
    return this.authService.hasRole(['admin', 'supervisor']);
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
        
        alert(`❌ Error al eliminar\n\n${errorMsg}`);
      }
    });
  }

  verDetalles(uploadId: string) {
    this.excelService.obtenerEstado(uploadId).subscribe({
      next: (estado) => {
        console.log('Estado del archivo:', estado);
        // Aquí podrías abrir un modal con los detalles
        alert(JSON.stringify(estado, null, 2));
      },
      error: (err) => {
        alert(err.error?.detail || 'Error al obtener el estado');
      }
    });
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
