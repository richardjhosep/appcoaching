// Mismas 5 categorías que los campos de texto libre ya deprecados de PlanDesarrollo
// (formacionLibros/Articulos/Videos/Podcasts/PracticaGuiada) — este enum estructura lo
// mismo en filas en vez de 5 textareas gigantes, ver plan-desarrollo.entity.ts.
export enum CategoriaRecursoPersonal {
  LIBRO = 'libro',
  ARTICULO = 'articulo',
  VIDEO = 'video',
  PODCAST = 'podcast',
  PRACTICA_GUIADA = 'practica_guiada',
}
