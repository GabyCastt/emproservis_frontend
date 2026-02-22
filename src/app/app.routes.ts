import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SolicitudesComponent } from './components/solicitudes/solicitudes.component';
import { UploadExcelComponent } from './components/upload-excel/upload-excel.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'solicitudes', component: SolicitudesComponent },
  { path: 'upload', component: UploadExcelComponent },
  { path: '**', redirectTo: '/dashboard' }
];
