// Compartido por Empresa.tarifaHora, Coachee.tarifaPropia e IndicadoresEconomicos — la
// moneda en la que se pactó una tarifa. Los cálculos de negocio (NegocioService) siempre
// convierten a CLP antes de sumar nada; UF es solo cómo se INGRESA/MUESTRA el monto.
export enum Moneda {
  CLP = 'clp',
  UF = 'uf',
}
