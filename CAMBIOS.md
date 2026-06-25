# Cambios — Actualización del 24-jun-2026

Resumen de qué se modificó y por qué mejora la app.

## Arquitectura (reescritura modular)
- **Qué:** la app pasó de un único `app-semestre.html` (~1250 líneas) a un proyecto
  **TypeScript + Vite** con carpetas por responsabilidad (config, types, database,
  services, finance, hooks, components, pages, utils, styles).
- **Por qué:** ahora cualquier cambio se localiza y prueba sin tocar todo lo demás;
  el código es tipado (menos errores) y escalable. Se conservó tu `localStorage`
  (`misem_v2`) y tu Supabase, así que **no se pierden datos**.
- **Sin duplicidad:** la lógica repetida se centralizó (p. ej. el patrón de pestañas
  en `hooks/useSegment.ts`, el guardado en `database/store.ts`).

## Finanzas
1. **Se eliminó la sección "Estadísticas"** (duplicaba "Proyección"). Ahora solo
   existe **Proyección** dentro de Dinero. Se quitó su acceso del menú lateral y se
   limpió el código asociado. *Mejora:* navegación más simple, sin funciones repetidas.
2. **Botón "Modificar pago" en cada tarjeta.** Abre un modal rápido para escribir el
   pago del mes (o elegir el mínimo) y guardarlo al instante, sin entrar a editar la
   tarjeta completa. La tarjeta muestra **siempre**: pago registrado del mes, pago
   mínimo y la **diferencia** entre ambos. *Mejora:* cambiar el pago toma 1–2 clics,
   ideal porque el banco lo cambia cada mes.

## Navegación (rediseño oscuro)
- **Qué:** barra superior, lateral, inferior, menús de pestañas y barras internas
  (selector de día) ahora usan tokens `--nav-*` **oscuros** consistentes, con mejor
  contraste, estados activos más visibles, íconos alineados y más espaciado.
- **Por qué:** identidad visual moderna y uniforme; se corrigió que algunas barras
  seguían saliendo claras.

## MealPrep (de menú simple a asistente)
- **Plan semanal variado** que rota el banco de recetas (no repite platillos) e
  incluye **overnight oats** como desayuno frecuente fijo.
- **Banco de recetas** fáciles y económicas, inspirado en el menú de tu nutrióloga
  (Michelle Guadarrama): alta proteína, mucha verdura y porciones de referencia,
  pero con más variedad. **Adaptado a tus gustos:** sin jitomate como ingrediente
  principal; con brócoli, zanahoria, pepino, lechuga, pasta boloñesa y smoothies.
- **Perfil físico** (178 cm, 67 kg, sin actividad) editable; calcula calorías,
  proteína e IMC de referencia y se **adapta** si cambias peso u objetivo.
- **Lista del súper inteligente:** se genera sola desde el plan, **agrupada por
  categorías** (Frutas, Verduras, Proteínas, Lácteos, Cereales, Despensa).
- **Integración con Finanzas:** al marcar "Lista como comprada", pregunta si registrar
  el gasto en Finanzas (categoría **Supermercado**, fecha de hoy, total y nota), para
  no capturar la compra dos veces.
- **Preparado a futuro:** la arquitectura (perfil + metas en `services/mealplan.ts`)
  deja lista la base para macros, calorías, agua, peso, inventario y recordatorios.

## Carpeta del proyecto (reorganización)
- La carpeta `ICOM JORGE_DUARTE` se separó en **Academico/**, **Proyectos/** y
  **respaldos/**. Nada se borró: lo viejo se movió a `respaldos/`.

---
Nota: la información financiera y nutricional es orientativa, no asesoría profesional.
