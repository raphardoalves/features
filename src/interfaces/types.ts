export type BlocoNota = {
    cabecalho: string
    linhas: string[]
}
export type Produto = {
    codigoProduto: number
    nomeProduto: string
    unidadeMedida: string
    quantidade: number
    precoPelaUnidade: number
    totalProduto: number
}
export type NotaFiscal = {
    numeroIndicador: string
    codigoNotaFiscal: number
    dataFaturamento: string
    codigoCliente: number
    nomeCliente: string
    totalNota: string
    comissaoNota: number
    produtos: Produto[]
}