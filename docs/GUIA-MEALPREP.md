# Guía interna de MealPrep (no se muestra en la app)

Documentación de referencia para desarrollo. Antes vivía como pestaña "Guía";
se retiró de la interfaz por decisión de producto y se conserva aquí.

## Filosofía del plan
Inspirado en el plan de la Nutrióloga Michelle Guadarrama: alta proteína, mucha
verdura, porciones medidas y desayunos tipo overnight oats / smoothies. La app
mantiene esa filosofía con más variedad y adaptada a los gustos de Jorge.

## Preferencias del usuario
- Evitar el jitomate como ingrediente principal (ofrecer alternativas).
- Favorecer: brócoli, zanahoria, pepino, lechuga, pasta boloñesa, smoothies y
  avenas trasnochadas (overnight oats), que pueden ir como desayuno frecuente fijo.

## Alimentos libres (consumo flexible)
Zanahoria/pepino/betabel rallado, jícama, brócoli, manzana, gelatina sin azúcar,
café o té sin azúcar.

## Hidratación
Meta base: 3 L/día (ajustable en Perfil). Botella a la vista = mejor recordatorio.

## Notas de implementación
- Recetas: `src/database/recipes.ts`.
- Plan/lista/metas: `src/services/mealplan.ts`.
- Seguimiento físico (peso, agua, rachas, mediciones, fotos): `src/services/tracking.ts`.
- Gráficas: `src/components/charts.ts`.
Orientación general, no sustituye asesoría profesional.
