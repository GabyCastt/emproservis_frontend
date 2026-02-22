# Estructura de Estilos

Esta carpeta contiene los estilos globales organizados de forma modular siguiendo las mejores prácticas de SCSS.

## Archivos

### `_variables.scss`
Define todas las variables del proyecto:
- Colores de la paleta
- Dimensiones (sidebar, navbar)
- Espaciado consistente
- Bordes y sombras
- Transiciones
- Tipografía
- Breakpoints responsive

### `_mixins.scss`
Mixins reutilizables para:
- Gradientes (primary, secondary, dark)
- Efectos hover (cards, botones)
- Focus rings para accesibilidad
- Media queries responsive

### `_base.scss`
Estilos base y reset:
- Reset CSS
- Estilos del body
- Variables CSS personalizadas
- Scrollbar personalizado
- Tipografía base

### `_animations.scss`
Animaciones globales:
- fadeIn
- slideInLeft
- slideInRight
- pulse

### `_components.scss`
Estilos de componentes Bootstrap personalizados:
- Cards
- Botones
- Formularios
- Tablas
- Badges
- Alerts
- Progress bars
- Spinners

### `_utilities.scss`
Clases de utilidad:
- Colores de texto y fondo
- Bordes
- Sombras personalizadas
- Overrides de Bootstrap

## Uso en Componentes

Para usar estas variables y mixins en tus componentes:

```scss
@import '../../../styles/variables';
@import '../../../styles/mixins';
@import '../../../styles/animations';

.mi-componente {
  color: $color-orange;
  padding: $spacing-md;
  @include gradient-primary;
  @include card-hover;
}
```

## Orden de Importación

En `styles.scss` los archivos se importan en este orden:
1. variables
2. mixins
3. base
4. animations
5. components
6. utilities

Este orden asegura que las dependencias estén disponibles cuando se necesiten.

## Convenciones

- Usa variables para todos los valores (colores, espaciado, etc.)
- Usa mixins para patrones repetitivos
- Mantén los estilos específicos de componentes en sus archivos `.scss`
- Los estilos globales van en esta carpeta
- Prefiere clases semánticas sobre utilidades inline
