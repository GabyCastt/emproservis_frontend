import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SolicitudesComponent } from './components/solicitudes/solicitudes.component';
import { UploadExcelComponent } from './components/upload-excel/upload-excel.component';
import { MisArchivosComponent } from './components/mis-archivos/mis-archivos.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'solicitudes', 
    component: SolicitudesComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'upload', 
    component: UploadExcelComponent,
    canActivate: [authGuard, roleGuard(['admin', 'analista', 'supervisor'])]
  },
  { 
    path: 'mis-archivos', 
    component: MisArchivosComponent,
    canActivate: [authGuard, roleGuard(['admin', 'analista', 'supervisor'])]
  },
  { 
    path: 'usuarios', 
    component: UsuariosComponent,
    canActivate: [authGuard, roleGuard(['admin'])]
  },
  { path: '**', redirectTo: '/login' }
];
