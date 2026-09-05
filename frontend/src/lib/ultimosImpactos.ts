// El impacto en el negocio es texto libre (lo que escribe el coach al cerrar un ciclo), no un
// número — no hay "top 5" por magnitud posible sin inventar un puntaje que no existe. Lo que sí
// es real y útil es "los 5 más recientes": una vitrina de resultados concretos para que el
// subgerente vea de un vistazo qué logró su equipo, sin tener que entrar a cada coachee.
export interface FilaConImpactos {
  coachee: { nombre: string }
  resumen: { competenciaNombre: string | null }
  ciclos: Array<{ fechaCierre: string | null; impactoNegocio: string | null }>
}

export interface ImpactoReciente {
  coacheeNombre: string
  competenciaNombre: string | null
  impacto: string
  fechaCierre: string
}

export function ultimosImpactos(filas: FilaConImpactos[], limite = 5): ImpactoReciente[] {
  return filas
    .flatMap((f) =>
      f.ciclos
        .filter((c): c is { fechaCierre: string; impactoNegocio: string } => !!c.fechaCierre && !!c.impactoNegocio)
        .map((c) => ({
          coacheeNombre: f.coachee.nombre,
          competenciaNombre: f.resumen.competenciaNombre,
          impacto: c.impactoNegocio,
          fechaCierre: c.fechaCierre,
        })),
    )
    .sort((a, b) => new Date(b.fechaCierre).getTime() - new Date(a.fechaCierre).getTime())
    .slice(0, limite)
}
