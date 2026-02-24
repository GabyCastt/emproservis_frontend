import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = false;
  error = '';
  showPassword = false;

  ngOnInit() {
    // Si ya está autenticado, redirigir al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.error = 'Por favor ingresa un email válido';
      return;
    }

    // Validación de fortaleza de contraseña (mínimo 10 caracteres)
    if (this.password.length < 10) {
      this.error = 'La contraseña debe tener al menos 10 caracteres';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login({ email: this.email, password: this.password })
      .subscribe({
        next: (response) => {
          console.log('Login exitoso:', response.usuario);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          console.error('Error en login:', err);
          
          // Manejar diferentes tipos de errores según el backend
          if (err.status === 429) {
            this.error = 'Demasiados intentos fallidos. Por favor intenta de nuevo en 15 minutos.';
          } else if (err.status === 401) {
            this.error = 'Email o contraseña incorrectos';
          } else if (err.status === 400) {
            // Errores de validación del backend
            this.error = err.error?.detail || 'Datos de inicio de sesión inválidos';
          } else if (err.status === 0) {
            this.error = 'No se puede conectar con el servidor. Verifica tu conexión.';
          } else {
            this.error = err.error?.detail || 'Error al iniciar sesión. Intenta de nuevo.';
          }
        }
      });
  }
}
