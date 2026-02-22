export interface Solicitud {
  id: string;
  numero_solicitud: string;
  estado: 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada' | 'en_proceso' | 'desembolsada' | 'cancelada';
  banco_solicitado: string;
  asesor_comercial: string;
  monto_solicitado: number;
  monto_aprobado?: number;
  plazo_meses: number;
  fecha_solicitud: string;
  sucursal: string;
  clientes?: Cliente;
  vehiculos?: Vehiculo;
  motivo_rechazo?: string;
  observaciones?: string;
  created_at: string;
}

export interface Cliente {
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string;
}

export interface Vehiculo {
  modelo: string;
  anio: number;
}

export interface CambiarEstadoRequest {
  estado: string;
  motivo_rechazo?: string;
  observaciones?: string;
}

export interface SolicitudesResponse {
  pagina: number;
  limite: number;
  total: number;
  solicitudes: Solicitud[];
}
