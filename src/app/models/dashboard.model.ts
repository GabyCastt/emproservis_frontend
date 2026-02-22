export interface DashboardKPIs {
  total_solicitudes: number;
  pendientes: number;
  en_revision: number;
  aprobadas: number;
  rechazadas: number;
  desembolsadas: number;
  canceladas: number;
  tasa_aprobacion: number;
  monto_total_aprobado: number | null;
  monto_promedio_solicitado: number;
  plazo_promedio_meses: number;
  clientes_unicos: number;
  asesores_activos: number;
}

export interface TendenciaMensual {
  mes: string;
  banco_solicitado: string;
  total: number;
  aprobadas: number;
  rechazadas: number;
  pendientes: number;
  monto_aprobado: number | null;
  tasa_aprobacion_mes: number;
}

export interface TendenciaAgrupada {
  mes: string;
  total: number;
  aprobadas: number;
  rechazadas: number;
  pendientes: number;
  tasa_aprobacion: number;
  bancos: {
    [banco: string]: {
      total: number;
      aprobadas: number;
      rechazadas: number;
    };
  };
}

export interface RankingAsesor {
  asesor_comercial: string;
  sucursal?: string;
  total_solicitudes: number;
  aprobadas: number;
  rechazadas?: number;
  pendientes?: number;
  tasa_aprobacion?: number;
  tasa_exito?: number;
  monto_gestionado?: number;
}
