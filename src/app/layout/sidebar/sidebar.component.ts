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
      { icon: 'bi-speedometer2', label: 'Dashboard', route: '/dashboard', roles: [] },
      { icon: 'bi-file-text', label: 'Solicitudes', route: '/solicitudes', roles: [] },
      { icon: 'bi-cloud-upload', label: 'Subir Excel', route: '/upload', roles: ['admin', 'analista', 'supervisor'] },
      { icon: 'bi-file-earmark-spreadsheet', label: 'Mis Archivos', route: '/mis-archivos', roles: [] },
      { icon: 'bi-people', label: 'Usuarios', route: '/usuarios', roles: ['admin'] }
    ];

    // Filtrar items según el rol del usuario
    return items.filter(item => {
      if (item.roles.length === 0) return true;
      return user && item.roles.includes(user.rol);
    });
  }
}
