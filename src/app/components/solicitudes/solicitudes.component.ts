import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SolicitudesService } from '../../services/solicitudes.service';
import { Solicitud } from '../../models/solicitud.model';

@Component({
  selector: 'app-solicitudes',
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitudes.component.html',
  styleUrl: './solicitudes.component.scss'
})
export class SolicitudesComponent implements OnInit {
  private solicitudesService = inject(SolicitudesService);
  private router = inject(Router);

  solicitudes: Solicitud[] = [];
  loading = true;
  paginaActual = 1;
  limite = 20;
  filtroEstado = '';
  filtroAsesor = '';
  filtroCliente = '';

  ngOnInit() {
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    this.loading = true;
    
    // Filtrar localmente por nombre de cliente si hay filtro
    this.solicitudesService.listar({
      estado: this.filtroEstado || undefined,
      asesor: this.filtroAsesor || undefined,
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

  aplicarFiltros() {
    this.paginaActual = 1;
    this.cargarSolicitudes();
  }

  limpiarFiltros() {
    this.filtroEstado = '';
    this.filtroAsesor = '';
    this.filtroCliente = '';
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
}
