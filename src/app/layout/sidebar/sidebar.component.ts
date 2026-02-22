import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  menuItems = [
    { icon: 'bi-speedometer2', label: 'Dashboard', route: '/dashboard' },
    { icon: 'bi-file-text', label: 'Solicitudes', route: '/solicitudes' },
    { icon: 'bi-cloud-upload', label: 'Subir Excel', route: '/upload' }
  ];
}
