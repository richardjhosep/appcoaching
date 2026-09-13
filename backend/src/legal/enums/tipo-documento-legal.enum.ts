export enum TipoDocumentoLegal {
  CONTRATO = 'contrato',
  NDA = 'nda',
  // #7 del backlog: la carta de invitación al proceso de coaching, mismo flujo de
  // subida/estado que Contrato y NDA — sin metadata de firma nueva (ver comentario en
  // EstadoDocumentoLegal).
  CARTA_INVITACION = 'carta_invitacion',
}
