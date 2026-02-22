# 🔧 Corrección: Ranking de Asesores

## 🐛 Problema Detectado

El endpoint `/dashboard/ranking-asesores` está devolviendo datos incorrectos donde el campo `asesor_comercial` contiene estados de solicitudes en lugar de nombres de asesores.

### Datos Incorrectos Recibidos:
```json
{
  "asesor_comercial": "pendiente",  // ❌ Esto es un estado, no un asesor
  "sucursal": "Laura Cárdenas",
  "total_solicitudes": 3,
  "aprobadas": 3
}
```

### Datos Correctos Esperados:
```json
{
  "asesor_comercial": "María López Suárez",  // ✅ Nombre del asesor
  "sucursal": "Quito Sur",
  "total_solicitudes": 14,
  "aprobadas": 6
}
```

## ✅ Solución Implementada en Frontend

### 1. Filtrado de Datos Inválidos

Se agregó lógica para filtrar asesores con datos inválidos:

```typescript
// Lista de estados que NO son nombres de asesores
const estadosInvalidos = [
  'pendiente', 
  'aprobada', 
  'rechazada', 
  'en_revision', 
  'en_proceso', 
  'desembolsada', 
  'cancelada', 
  ''
];

// Filtrar solo asesores válidos
this.rankingAsesores = data
  .filter(asesor => {
    // 1. Verificar que el nombre no sea un estado
    const nombreValido = asesor.asesor_comercial && 
                        !estadosInvalidos.includes(
                          asesor.asesor_comercial.toLowerCase().trim()
                        );
    
    // 2. Verificar que tenga al menos una aprobación
    const tieneAprobadas = asesor.aprobadas > 0;
    
    return nombreValido && tieneAprobadas;
  })
  .sort((a, b) => {
    // Ordenar por tasa de éxito descendente
    const tasaA = a.tasa_exito || a.tasa_aprobacion || 0;
    const tasaB = b.tasa_exito || b.tasa_aprobacion || 0;
    return tasaB - tasaA;
  })
  .slice(0, 10); // Top 10
```

### 2. Modelo Actualizado

Se actualizó el modelo para soportar ambos formatos de tasa:

```typescript
export interface RankingAsesor {
  asesor_comercial: string;
  sucursal?: string;
  total_solicitudes: number;
  aprobadas: number;
  rechazadas?: number;
  pendientes?: number;
  tasa_aprobacion?: number;  // Formato 1
  tasa_exito?: number;        // Formato 2
  monto_gestionado?: number;
}
```

### 3. Función Helper

Se agregó una función para obtener la tasa correcta:

```typescript
getTasaAsesor(asesor: RankingAsesor): number {
  return asesor.tasa_exito || asesor.tasa_aprobacion || 0;
}
```

### 4. Vista Actualizada

El HTML ahora muestra la sucursal si está disponible:

```html
<small class="text-muted">
  {{ asesor.aprobadas }} aprobadas de {{ asesor.total_solicitudes }}
  @if (asesor.sucursal) {
    <span class="ms-2">
      <i class="bi bi-geo-alt"></i> {{ asesor.sucursal }}
    </span>
  }
</small>
```

## 🔍 Problema en el Backend

El problema está en la vista de Supabase `v_ranking_asesores`. Parece que está haciendo un GROUP BY incorrecto que mezcla estados con nombres de asesores.

### Solución Recomendada en Backend:

Revisar la vista SQL en Supabase:

```sql
-- Vista correcta debería ser algo como:
CREATE OR REPLACE VIEW v_ranking_asesores AS
SELECT 
  asesor_comercial,
  sucursal,
  COUNT(*) as total_solicitudes,
  COUNT(*) FILTER (WHERE estado = 'aprobada') as aprobadas,
  COUNT(*) FILTER (WHERE estado = 'rechazada') as rechazadas,
  COUNT(*) FILTER (WHERE estado IN ('pendiente', 'en_revision', 'en_proceso')) as pendientes,
  ROUND(
    (COUNT(*) FILTER (WHERE estado = 'aprobada')::numeric / 
     NULLIF(COUNT(*), 0) * 100), 
    2
  ) as tasa_exito,
  SUM(CASE WHEN estado = 'aprobada' THEN monto_aprobado ELSE 0 END) as monto_gestionado
FROM solicitudes_credito
WHERE asesor_comercial IS NOT NULL 
  AND asesor_comercial != ''
  AND asesor_comercial NOT IN ('pendiente', 'aprobada', 'rechazada', 'en_revision', 'en_proceso', 'desembolsada', 'cancelada')
GROUP BY asesor_comercial, sucursal
HAVING COUNT(*) > 0
ORDER BY tasa_exito DESC, aprobadas DESC;
```

## 📊 Resultado

### Antes (con datos incorrectos):
- Mostraba 34 "asesores" incluyendo estados
- Muchos con 0% de aprobación
- Nombres inválidos como "pendiente", "aprobada", etc.

### Después (con filtrado):
- Muestra solo asesores reales
- Solo asesores con al menos 1 aprobación
- Ordenados por tasa de éxito
- Top 10 más efectivos

## 🎯 Asesores Válidos Detectados

Según los datos recibidos, estos son los asesores reales:

1. **Juan Pérez Castro** - 66.67% (4 de 6)
2. **María López Suárez** - 42.86% (6 de 14)
3. **Andrea Vega Ríos** - 33.33% (4 de 12)
4. **Carlos Mora Vega** - 25% (4 de 16)

Los demás registros son datos corruptos o mal agrupados.

## ✅ Verificación

Para verificar que funciona correctamente:

1. Abre el dashboard
2. Ve a la sección "Top Asesores"
3. Deberías ver solo nombres reales de asesores
4. Todos deberían tener al menos 1 aprobación
5. Ordenados por tasa de éxito

## 🔄 Próximos Pasos

1. **Corregir la vista en Supabase** - Prioridad ALTA
2. **Limpiar datos corruptos** - Revisar por qué hay estados en el campo asesor_comercial
3. **Agregar validación en el backend** - Prevenir que se guarden datos inválidos
4. **Agregar tests** - Verificar que los datos sean consistentes

## 📝 Notas

- El filtrado en frontend es una solución temporal
- La solución definitiva debe ser en el backend
- Los datos sugieren que hubo un problema en la importación del Excel
- Revisar el parser de Excel para asegurar que mapea correctamente las columnas
