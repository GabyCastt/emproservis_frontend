import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExcelService, UploadResponse, InspeccionExcel, PreviewFilas } from '../../services/excel.service';

@Component({
  selector: 'app-upload-excel',
  imports: [CommonModule],
  templateUrl: './upload-excel.component.html',
  styleUrl: './upload-excel.component.scss'
})
export class UploadExcelComponent {
  private excelService = inject(ExcelService);
  private router = inject(Router);

  selectedFile: File | null = null;
  uploading = false;
  uploadResult: UploadResponse | null = null;
  error = '';
  isDragging = false;

  // Inspección
  inspeccionando = false;
  inspeccionResult: InspeccionExcel | null = null;
  mostrarInspeccion = false;
  
  // Preview
  previewing = false;
  previewResult: PreviewFilas | null = null;
  mostrarPreview = false;

  // Helper para templates
  Object = Object;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file: File) {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      this.error = 'Solo se aceptan archivos Excel (.xlsx, .xls) o CSV';
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      this.error = 'El archivo excede el límite de 50 MB';
      return;
    }

    this.selectedFile = file;
    this.error = '';
    this.uploadResult = null;
    this.inspeccionResult = null;
    this.previewResult = null;
    this.mostrarInspeccion = false;
    this.mostrarPreview = false;
  }

  inspeccionarArchivo() {
    if (!this.selectedFile) return;

    this.inspeccionando = true;
    this.error = '';

    this.excelService.inspeccionarArchivo(this.selectedFile).subscribe({
      next: (result) => {
        this.inspeccionResult = result;
        this.mostrarInspeccion = true;
        this.inspeccionando = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Error al inspeccionar el archivo';
        this.inspeccionando = false;
      }
    });
  }

  previewArchivo() {
    if (!this.selectedFile) return;

    this.previewing = true;
    this.error = '';

    this.excelService.previewPrimerasFilas(this.selectedFile, 10).subscribe({
      next: (result) => {
        this.previewResult = result;
        this.mostrarPreview = true;
        this.previewing = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Error al previsualizar el archivo';
        this.previewing = false;
      }
    });
  }

  getVeredictoBadgeClass(veredicto: string): string {
    const classes: { [key: string]: string } = {
      'listo': 'badge bg-success',
      'advertencia': 'badge bg-warning text-dark',
      'no_importar': 'badge bg-danger'
    };
    return classes[veredicto] || 'badge bg-secondary';
  }

  getVeredictTexto(veredicto: string): string {
    const textos: { [key: string]: string } = {
      'listo': 'Listo para importar',
      'advertencia': 'Advertencias detectadas',
      'no_importar': 'No importar'
    };
    return textos[veredicto] || veredicto;
  }

  uploadFile() {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.error = '';

    this.excelService.subirArchivo(this.selectedFile).subscribe({
      next: (result) => {
        this.uploadResult = result;
        this.uploading = false;
        this.selectedFile = null;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Error al subir el archivo';
        this.uploading = false;
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  reset() {
    this.selectedFile = null;
    this.uploadResult = null;
    this.inspeccionResult = null;
    this.previewResult = null;
    this.error = '';
    this.mostrarInspeccion = false;
    this.mostrarPreview = false;
  }

  volver() {
    this.router.navigate(['/dashboard']);
  }

  irAMisArchivos() {
    this.router.navigate(['/mis-archivos']);
  }
}
