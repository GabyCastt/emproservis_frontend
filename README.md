# 🚗 Emproservis KIA - Frontend Angular

Frontend para el sistema de gestión de solicitudes de crédito KIA.

## 🚀 Cómo arrancar el proyecto

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar la URL del backend
El archivo `src/environments/environment.ts` ya está configurado para apuntar a `http://localhost:8000`.

Si tu backend está en otra URL, modifica este archivo.

### 3. Arrancar el servidor de desarrollo
```bash
npm start
```

O también:
```bash
ng serve
```

La aplicación estará disponible en: **http://localhost:4200**

## 📁 Estructura del proyecto

```
src/app/
├── components/          # Componentes de la aplicación
│   ├── login/          # Pantalla de login
│   ├── dashboard/      # Dashboard con KPIs
│   ├── solicitudes/    # Lista de solicitudes
│   └── upload-excel/   # Subir archivos Excel
├── services/           # Servicios para comunicación con API
│   ├── auth.service.ts
│   ├── solicitudes.service.ts
│   ├── dashboard.service.ts
│   └── excel.service.ts
├── models/             # Interfaces TypeScript
├── guards/             # Guards para proteger rutas
└── interceptors/       # Interceptor para agregar JWT
```

## 🔐 Funcionalidades

### Autenticación
- Login con email y contraseña
- JWT almacenado en localStorage
- Auto-refresh de token
- Logout

### Dashboard
- KPIs principales (total, aprobadas, rechazadas, pendientes)
- Tasa de aprobación
- Monto total aprobado

### Solicitudes
- Lista paginada de solicitudes
- Filtros por estado y asesor
- Vista detallada de cada solicitud

### Upload Excel
- Drag & drop de archivos
- Validación de formato y tamaño
- Progreso de carga
- Resultados del procesamiento

## 🎨 Estilos

El proyecto usa SCSS con estilos personalizados. Los colores principales son:
- Primario: Gradiente morado (#667eea → #764ba2)
- Éxito: #28a745
- Error: #dc3545
- Advertencia: #ffc107

## 🔧 Comandos útiles

```bash
# Desarrollo
npm start

# Build para producción
npm run build

# Linting
ng lint

# Tests
ng test
```

## 📡 Endpoints del Backend

El frontend se conecta a estos endpoints:

- `POST /auth/login` - Iniciar sesión
- `POST /auth/logout` - Cerrar sesión
- `GET /dashboard/kpis` - Obtener KPIs
- `GET /solicitudes` - Listar solicitudes
- `POST /excel/upload` - Subir Excel

## 🔒 Roles y Permisos

- **solo_lectura**: Solo puede ver solicitudes
- **analista**: Puede ver y subir Excel
- **supervisor**: Puede ver, subir y cambiar estados
- **admin**: Acceso total

## 🐛 Troubleshooting

### Error de CORS
Si ves errores de CORS, verifica que el backend tenga configurado:
```python
allow_origins=["http://localhost:4200"]
```

### Token expirado
El token JWT expira en 1 hora. Si ves errores 401, vuelve a hacer login.

### Backend no responde
Verifica que el backend esté corriendo en `http://localhost:8000`

## 📝 Próximas mejoras

- [ ] Gráficos con Chart.js o ApexCharts
- [ ] Notificaciones en tiempo real
- [ ] Exportar reportes a PDF/Excel
- [ ] Gestión de usuarios (admin)
- [ ] Cambio de estado de solicitudes
- [ ] Búsqueda avanzada

## 🤝 Contribuir

1. Crea una rama para tu feature
2. Haz commit de tus cambios
3. Push a la rama
4. Abre un Pull Request

---

Desarrollado con ❤️ usando Angular 19
