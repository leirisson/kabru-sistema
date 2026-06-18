export type SlaStatus = 'verde' | 'amarelo' | 'vermelho'

export function calcularSla(
  entradaEm: Date,
  avisoMinutos: number,
  criticoMinutos: number,
): SlaStatus {
  const decorrido = (Date.now() - entradaEm.getTime()) / 60_000
  if (decorrido >= criticoMinutos) return 'vermelho'
  if (decorrido >= avisoMinutos) return 'amarelo'
  return 'verde'
}

export function formatarDecorrido(entradaEm: Date): string {
  const minutos = Math.floor((Date.now() - entradaEm.getTime()) / 60_000)
  if (minutos < 60) return `${minutos}min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto > 0 ? `${horas}h ${resto}min` : `${horas}h`
}
