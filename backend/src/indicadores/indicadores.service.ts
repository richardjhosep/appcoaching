import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Not, IsNull, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { IndicadorEconomico } from './entities/indicador-economico.entity';
import { fechaSimpleHoyChile } from '../common/chile-time.util';

export interface ValorUfHoy {
  valorUf: number;
  fecha: string;
  fuente: string;
  /** true si el valor mostrado no es de hoy (la CMF no respondió y se usó el último cacheado). */
  desactualizado: boolean;
}

const CMF_BASE = 'https://api.cmfchile.cl/api-sbifv3/recursos_api';

/** "40.910,10" (formato chileno) -> 40910.10 */
function parseValorCmf(valor: string): number {
  return parseFloat(valor.replace(/\./g, '').replace(',', '.'));
}

@Injectable()
export class IndicadoresService {
  private readonly logger = new Logger(IndicadoresService.name);

  constructor(
    @InjectRepository(IndicadorEconomico)
    private readonly indicadores: Repository<IndicadorEconomico>,
    private readonly config: ConfigService,
  ) {}

  /**
   * UF/Dólar del día actual desde la CMF. Si la CMF no tiene el dato de hoy todavía
   * (pasa seguido con el dólar los fines de semana/feriados — la UF en cambio siempre
   * trae el mes completo por adelantado), busca el mes completo y toma el más reciente
   * con fecha <= hoy.
   */
  private async fetchDesdeCmf(
    recurso: 'uf' | 'dolar',
    apiKey: string,
  ): Promise<{ valor: number; fecha: string } | null> {
    try {
      const res = await fetch(
        `${CMF_BASE}/${recurso}?apikey=${apiKey}&formato=json`,
      );
      if (res.ok) {
        const data = (await res.json()) as {
          UFs?: unknown[];
          Dolares?: unknown[];
        };
        const lista = (data.UFs ?? data.Dolares) as
          { Valor: string; Fecha: string }[] | undefined;
        const fila = lista?.[0];
        if (fila)
          return { valor: parseValorCmf(fila.Valor), fecha: fila.Fecha };
      }
    } catch (err) {
      this.logger.warn(
        `Fetch CMF /${recurso} (hoy) falló: ${(err as Error).message}`,
      );
    }

    // Fallback: el mes completo, más reciente <= hoy.
    const hoy = fechaSimpleHoyChile();
    const [anio, mes] = hoy.split('-');
    try {
      const res = await fetch(
        `${CMF_BASE}/${recurso}/${anio}/${Number(mes)}?apikey=${apiKey}&formato=json`,
      );
      if (!res.ok) return null;
      const data = (await res.json()) as {
        UFs?: unknown[];
        Dolares?: unknown[];
      };
      const lista = (data.UFs ?? data.Dolares) as
        { Valor: string; Fecha: string }[] | undefined;
      const filas = (lista ?? []).filter((f) => f.Fecha <= hoy);
      const ultima = filas.at(-1);
      return ultima
        ? { valor: parseValorCmf(ultima.Valor), fecha: ultima.Fecha }
        : null;
    } catch (err) {
      this.logger.warn(
        `Fetch CMF /${recurso} (mes) falló: ${(err as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Valor UF a usar HOY para cualquier conversión de negocio. Cadena de resolución:
   * 1. Ya cacheado para hoy (evita golpear la CMF más de una vez al día).
   * 2. Fetch a la CMF (requiere CMF_API_KEY) — se cachea, incluyendo el dólar si vino.
   * 3. Último valor cacheado (de cualquier fecha pasada) — `desactualizado: true`.
   * Nunca lanza: si no hay ningún valor nunca cacheado y la CMF no responde, retorna null
   * y el llamador decide (ver NegocioService).
   */
  async getOrFetchHoy(): Promise<ValorUfHoy | null> {
    const hoy = fechaSimpleHoyChile();
    const cacheHoy = await this.indicadores.findOne({ where: { fecha: hoy } });
    if (cacheHoy?.valorUf != null) {
      return {
        valorUf: cacheHoy.valorUf,
        fecha: hoy,
        fuente: cacheHoy.fuente,
        desactualizado: false,
      };
    }

    const apiKey = this.config.get<string>('cmf.apiKey');
    if (apiKey) {
      const [uf, dolar] = await Promise.all([
        this.fetchDesdeCmf('uf', apiKey),
        this.fetchDesdeCmf('dolar', apiKey),
      ]);
      if (uf) {
        await this.indicadores.save(
          this.indicadores.create({
            fecha: hoy,
            valorUf: uf.valor,
            valorUsd: dolar?.valor ?? null,
            fuente: 'cmf',
          }),
        );
        return {
          valorUf: uf.valor,
          fecha: hoy,
          fuente: 'cmf',
          desactualizado: false,
        };
      }
      this.logger.warn(
        'CMF no devolvió un valor de UF para hoy ni para el mes actual.',
      );
    }

    const ultimoCacheado = await this.indicadores.findOne({
      where: { valorUf: Not(IsNull()), fecha: LessThanOrEqual(hoy) },
      order: { fecha: 'DESC' },
    });
    if (!ultimoCacheado) return null;
    return {
      valorUf: ultimoCacheado.valorUf!,
      fecha: ultimoCacheado.fecha,
      fuente: ultimoCacheado.fuente,
      desactualizado: true,
    };
  }

  /**
   * El coach tipea el valor UF de hoy a mano — fallback si la CMF está caída o todavía
   * no se configuró CMF_API_KEY. Pisa cualquier valor de hoy ya cacheado.
   */
  async setManualHoy(valorUf: number): Promise<ValorUfHoy> {
    const hoy = fechaSimpleHoyChile();
    let fila = await this.indicadores.findOne({ where: { fecha: hoy } });
    if (!fila) fila = this.indicadores.create({ fecha: hoy });
    fila.valorUf = valorUf;
    fila.fuente = 'manual';
    await this.indicadores.save(fila);
    return { valorUf, fecha: hoy, fuente: 'manual', desactualizado: false };
  }
}
