import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private authService = inject(AuthService);

  get menuItems() {
    const user = this.authService.getCurrentUser();
    const items = [
      { 
        icon: 'bi-speedometer2', 
        label: 'Dashboard', 
        route: '/dashboard', 
        roles: [] // Todos pueden ver el dashboard
      },
      { 
        icon: 'bi-file-text', 
        label: 'Solicitudes', 
        route: '/solicitudes', 
        roles: [] // Todos pueden ver solicitudes
      },
      { 
        icon: 'bi-cloud-upload', 
        label: 'Subir Excel', 
        route: '/upload', 
        roles: ['admin', 'analista', 'supervisor'] // Solo estos roles pueden subir
      },
      { 
        icon: 'bi-file-earmark-spreadsheet', 
        label: 'Mis Archivos', 
        route: '/mis-archivos', 
        roles: ['admin', 'analista', 'supervisor'] // Solo quienes pueden subir pueden ver sus archivos
      },
      { 
        icon: 'bi-people', 
        label: 'Usuarios', 
        route: '/usuarios', 
        roles: ['admin'] // Solo admin puede gestionar usuarios
      }
    ];

    // Filtrar items según el rol del usuario
    return items.filter(item => {
      if (item.roles.length === 0) return true;
      return user && item.roles.includes(user.rol);
    });
  }
}
