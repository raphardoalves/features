import { NotaFiscal } from "../interfaces/types"

function limparTexto(texto: string): string {
    const linhas = texto.split('\n')
    const palavrasChave = [
        'Cod.Prod','Produto','Embalagem','Pr.Unt','Vl.Total',
        '%Com.%','Rateio','Vl.Com','Qtde'
    ]
    const linhasFiltradas = linhas.filter((linha) => {
        const linhaLimpa = linha.trim()
        if (!linhaLimpa) return false
        const ehCabecalho = palavrasChave.every(p =>
            linhaLimpa.includes(p)
        )
        return !ehCabecalho
    })
    const textoLimpo = linhasFiltradas.join('\n')
    const texto1 = textoLimpo.replace(/ANDERSON\s+DE/g, "");
    const texto2 = texto1.replace(/Fil\.\s*Nr\.\s*Nota\s*Dt\.\s*Venda\s*Cod\.\s*Cli\.\s*Cliente\s*Vlr\.\s*Fat\s*%\s*Com\.\%\s*Rateio\s*Vl\.\s*Com\.\s*Emitente/g, "")
    const texto3 = texto2.replace( /Cod\.\s*Prod\.\s*Produto\s*Embalagem\s*UN\s*Qtde\s*Pr\.\s*Unt\.\s*Vl\.\s*Total\s*%\s*Com\.\%\s*Rateio\s*Vl\.\s*Com\./g, "" )
    const texto4 = texto3.replace(/SUPERVISOR\s*:\s*\d+\s+[A-ZÀ-Ú\s]+/g, "")
    const texto5 = texto4.replace(/RCA\s*:\s*\d+\s+[A-ZÀ-Ú\s]+/g, "")
    const texto6 = texto5.replace(/:\s*\d+\s+[A-ZÀ-Ú]+(?:\s+[A-ZÀ-Ú]+)*/g, "")
    return texto6
}
function extrairNotasFiscais(texto: string) {
    const linhas = texto.split('\n')
    const regexNota = /^\s*(\d+)\s+(\d+)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d+)\s+(.+?)\s+([\d\.]+,\d{2})\s+[\d\.]+,\d{4}\s+[\d\.]+,\d{2}\s+([\d\.]+,\d{2})/
    const regexProduto = /^\s*(\d{3,})\s+(.+)/
    const regexDevolucao = /^\s*(\d{2}\/\d{2}\/\d{4})\s+(\d+)\s+(.+?)\s{2,}(\d+)\s+(\d+)\s+([\w.]+)\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})$/
    const notas: NotaFiscal[] = []
    let notaAtual: NotaFiscal | null = null
    for (const linha of linhas) {
        const matchNota = linha.match(regexNota)

        if (matchNota) {
            if (notaAtual) { notas.push(notaAtual) }
            const [
                _,
                numeroIndicador,
                codigoNotaFiscal,
                dataFaturamento,
                codigoCliente,
                nomeCliente,
                totalNota,
                comissao
            ] = matchNota
            notaAtual = {
                numeroIndicador: numeroIndicador ?? '',
                codigoNotaFiscal: Number(codigoNotaFiscal?.replace(/\./g, '').replace(',', '.')) ?? '',
                dataFaturamento: dataFaturamento ?? '',
                codigoCliente: Number(codigoCliente?.replace(/\./g, '').replace(',', '.')) ?? '',
                nomeCliente: nomeCliente?.replace(/\s+/g, ' ').trim() ?? '',
                totalNota: totalNota ?? '',
                comissaoNota: Number(comissao?.replace(/\./g, '').replace(',', '.')) ?? '',
                produtos: []
            }
            continue
        }
        if (notaAtual) {
            const linhaLimpa = linha.trim()

            if (!linhaLimpa || linhaLimpa.includes('Cod.Prod.')) { continue }

            const matchProduto = linhaLimpa.match(regexProduto)

            if (!matchProduto) { continue }
            const partes = linhaLimpa.split(/\s{2,}/)

            if (partes.length < 7) { continue }
            const codigoProduto = partes[0]
            const unidadeMedida = partes[partes.length - 7]
            const quantidade = partes[partes.length - 6]
            const precoPelaUnidade = partes[partes.length - 5]
            const totalProduto = partes[partes.length - 4]
            const nomeProduto = partes.slice(1, partes.length - 7).join(' ').replace(/\s+/g, ' ').trim()

            if (!nomeProduto) { continue }
            if (!precoPelaUnidade?.includes(',') || !totalProduto?.includes(',')) { continue }
            notaAtual.produtos.push({
                codigoProduto: Number(codigoProduto?.replace(/\./g, '').replace(',', '.')) ?? '',
                nomeProduto: nomeProduto ?? '',
                unidadeMedida: unidadeMedida ?? '',
                quantidade: Number(quantidade?.replace(/\./g, '').replace(',', '.')),
                precoPelaUnidade: Number(precoPelaUnidade?.replace(/\./g, '').replace(',', '.')) ?? '',
                totalProduto: Number(totalProduto?.replace(/\./g, '').replace(',', '.')) ?? ''
            })
        }
    }
    const devolucao = []
    for (const linha of linhas) {
        const match = linha.match(regexDevolucao)
        if (!match) continue
        const [
            _,
            data,
            pedido,
            cliente,
            codigo,
            loja,
            vendedor,
            valorPedido,
            valorBase,
            percentual,
            percentualBase,
            comissao
        ] = match
        devolucao.push({
            data,
            pedido: Number(pedido),
            cliente: cliente?.replace(/\s+/g, ' ').trim(),
            codigo: Number(codigo),
            loja: Number(loja),
            vendedor,
            valorPedido: Number(valorPedido?.replace(/\./g, '').replace(',', '.')),
            valorBase: Number(valorBase?.replace(/\./g, '').replace(',', '.')),
            percentual: Number(percentual?.replace(/\./g, '').replace(',', '.')),
            percentualBase: Number(percentualBase?.replace(/\./g, '').replace(',', '.')),
            comissao: Number(comissao?.replace(/\./g, '').replace(',', '.'))
        })
    }

    if (notaAtual) {
        notas.push(notaAtual)
    }
    return {notas, devolucao}
}

export const arrayCliente = {
    "104407": '61020854000124',
    "49776": '39907998000148',
    "28705": '05002327000116',
    "106874": '62350139000112',
    "48599": "49250770000181",
    "49077": "14135331000143",
    "48636": "50415381000148",
    "49564": "44747898000131",
    "49307": "61384335000145",
    "50371": "35447869000163",
    "48693": "19045744000150",
    "47914": "09253353000259",
    "6159": "30384627000154",
    "7300": "08724540000120",
    "47800": "58676425000103",
    "42025": "10963421000171",
    "41715": "20266712000164",
    "45513": "15698256000191",
    "41708": "48560804000171",
    "39609": "21773850000100",
    "41032": "43069172000124",
    "47911": "09253353000178",
    "47684": "30299445000185",
    "40743": "46643717000152",
    "37044": "52669896000108",
    "39269": "03543323000110",
    "39260": "08504882000134",
    "24362": "45584430000136",
    "28231": "08504882000304",
    "29295": "10985095000101",
    "30168": "44231828000126",
    "21983": "03884827000101",
    "35680": "49417948000136",
    "26048": "08724540000200",
    "105585": "68399682000433",
    "10351": "68399682000190",
    "104791": "10872465000196",
    "20106": "04550451000153",
    "10448": "08801638000133",
    "102220": "44253212000156",
    "103422": "65844722000178",
    "105872": "65908808000117",
    "11901": "31921255000110",
    "14109": "49655947000120",
    "100802": "50277474000153",
    "10114": "18573230000105",
    "100770": "12208194000102",
    "101132": "09253353000330",
    "101903": "19753993000109"
}

export default {
    limparTexto,
    extrairNotasFiscais
}