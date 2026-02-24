import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService, Usuario, RegistroRequest } from '../../services/usuarios.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss'
})
export class UsuariosComponent implements OnInit {
  private usuariosService = inject(UsuariosService);
  private authService = inject(AuthService);

  usuarios: Usuario[] = [];
  loading = true;
  error = '';
  success = '';

  // Formulario de nuevo usuario
  mostrarFormulario = false;
  nuevoUsuario: RegistroRequest = {
    email: '',
    password: '',
    nombre_completo: '',
    rol: 'solo_lectura'
  };

  roles = [
    { value: 'admin', label: 'Administrador', descripcion: 'Acceso total al sistema' },
    { value: 'supervisor', label: 'Supervisor', descripcion: 'Puede subir Excel y cambiar estados' },
    { value: 'analista', label: 'Analista', descripcion: 'Puede subir Excel' },
    { value: 'solo_lectura', label: 'Solo Lectura', descripcion: 'Solo puede ver información' }
  ];

  // Validación de contraseña en tiempo real
  get passwordStrength() {
    const password = this.nuevoUsuario.password;
    
    const checks = {
      length: password ? password.length >= 10 : false,
      uppercase: password ? /[A-Z]/.test(password) : false,
      number: password ? /[0-9]/.test(password) : false,
      symbol: password ? /[!@#$%^&*(),.?":{}|<>]/.test(password) : false
    };

    if (!password) {
      return { level: 0, text: '', class: '', checks };
    }

    let strength = 0;
    if (checks.length) strength++;
    if (checks.uppercase) strength++;
    if (checks.number) strength++;
    if (checks.symbol) strength++;

    const levels = [
      { level: 0, text: 'Muy débil', class: 'text-danger' },
      { level: 1, text: 'Débil', class: 'text-warning' },
      { level: 2, text: 'Regular', class: 'text-info' },
      { level: 3, text: 'Buena', class: 'text-primary' },
      { level: 4, text: 'Fuerte', class: 'text-success' }
    ];

    return { ...levels[strength], checks };
  }

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.loading = true;
    this.error = '';
    
    this.usuariosService.listarUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar usuarios';
        this.loading = false;
        console.error(err);
      }
    });
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.resetFormulario();
    }
  }

  resetFormulario() {
    this.nuevoUsuario = {
      email: '',
      password: '',
      nombre_completo: '',
      rol: 'solo_lectura'
    };
    this.error = '';
    this.success = '';
  }

  crearUsuario() {
    this.error = '';
    this.success = '';

    // Validaciones
    if (!this.nuevoUsuario.email || !this.nuevoUsuario.password || !this.nuevoUsuario.nombre_completo) {
      this.error = 'Todos los campos son obligatorios';
      return;
    }

    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.nuevoUsuario.email)) {
      this.error = 'Por favor ingresa un email válido';
      return;
    }

    // Validación de fortaleza de contraseña
    if (this.nuevoUsuario.password.length < 10) {
      this.error = 'La contraseña debe tener al menos 10 caracteres';
      return;
    }

    // Validar que tenga al menos una mayúscula
    if (!/[A-Z]/.test(this.nuevoUsuario.password)) {
      this.error = 'La contraseña debe contener al menos una letra mayúscula';
      return;
    }

    // Validar que tenga al menos un número
    if (!/[0-9]/.test(this.nuevoUsuario.password)) {
      this.error = 'La contraseña debe contener al menos un número';
      return;
    }

    // Validar que tenga al menos un símbolo
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(this.nuevoUsuario.password)) {
      this.error = 'La contraseña debe contener al menos un símbolo (!@#$%^&*(),.?":{}|<>)';
      return;
    }

    this.loading = true;

    this.usuariosService.registrarUsuario(this.nuevoUsuario).subscribe({
      next: (response) => {
        this.success = `Usuario ${this.nuevoUsuario.email} creado exitosamente`;
        this.resetFormulario();
        this.mostrarFormulario = false;
        this.cargarUsuarios();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || 'Error al crear usuario';
        console.error(err);
      }
    });
  }

  cambiarEstadoUsuario(usuario: Usuario) {
    if (confirm(`¿Deseas ${usuario.activo ? 'desactivar' : 'activar'} a ${usuario.nombre_completo}?`)) {
      if (usuario.activo) {
        this.usuariosService.desactivarUsuario(usuario.id).subscribe({
          next: () => {
            this.success = `Usuario ${usuario.email} desactivado`;
            this.cargarUsuarios();
          },
          error: (err) => {
            this.error = 'Error al desactivar usuario';
            console.error(err);
          }
        });
      } else {
        this.usuariosService.actualizarUsuario(usuario.id, { activo: true }).subscribe({
          next: () => {
            this.success = `Usuario ${usuario.email} activado`;
            this.cargarUsuarios();
          },
          error: (err) => {
            this.error = 'Error al activar usuario';
            console.error(err);
          }
        });
      }
    }
  }

  cambiarRol(usuario: Usuario, nuevoRol: string) {
    if (confirm(`¿Cambiar el rol de ${usuario.nombre_completo} a ${nuevoRol}?`)) {
      this.usuariosService.actualizarUsuario(usuario.id, { rol: nuevoRol }).subscribe({
        next: () => {
          this.success = `Rol actualizado para ${usuario.email}`;
          this.cargarUsuarios();
        },
        error: (err) => {
          this.error = 'Error al cambiar rol';
          console.error(err);
        }
      });
    }
  }

  getRolLabel(rol: string): string {
    const rolObj = this.roles.find(r => r.value === rol);
    return rolObj ? rolObj.label : rol;
  }

  getRolClass(rol: string): string {
    const clases: { [key: string]: string } = {
      'admin': 'badge bg-danger',
      'supervisor': 'badge bg-warning text-dark',
      'analista': 'badge bg-info',
      'solo_lectura': 'badge bg-secondary'
    };
    return clases[rol] || 'badge bg-secondary';
  }

  formatFecha(fecha: string): string {
    if (!fecha) return 'Nunca';
    return new Date(fecha).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  esUsuarioActual(usuario: Usuario): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.id === usuario.id;
  }
}
