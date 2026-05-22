import fenix from './services/fenix'
import { conn_crm } from './conn/conn'
import { arrayCliente } from './services/fenix'
import { sleep } from './services/ultius'

const adicionar_nota = async () => {
    const textoBruto = await fenix.extrairTextoBruto()
    const textoLimpo = fenix.limparTexto(textoBruto)
    const notas = fenix.extrairNotasFiscais(textoLimpo)
    for(let i in notas) {
        const codigo_string = String(notas[i]?.codigoCliente)
        const cnpj = arrayCliente[codigo_string as keyof typeof arrayCliente]

        const numeroNota = notas[i]?.codigoNotaFiscal
        const comissao = notas[i]?.comissaoNota || 0

        const [dia, mes, ano]: any = notas[i]?.dataFaturamento.split('/')
        const data_mysql = `${ano}-${mes}-${dia}`;

        if (!numeroNota || !cnpj) continue

        const [retorno]: any = await conn_crm.execute(
            `INSERT INTO pedido (
            cnpj_fornecedor, 
            tipo, 
            numero_nota, 
            cnpj_cliente, 
            comissao_nota, 
            data_faturado
            ) VALUES ('17257812000110','VENDA',?,?,?,?)`, 
            [
                numeroNota, 
                cnpj, 
                comissao,
                data_mysql
            ])

        console.log(`| ** Criando nota: ${numeroNota} Cliente: ${notas[i]?.nomeCliente} ** |`)

        const pedido_id = retorno.insertId
        for (const item of notas[i]?.produtos || []) {
            await conn_crm.execute(
                `INSERT INTO produtos_nota (
                    id_pedido,
                    codigo_produto,
                    nome_produto,
                    quantidade,
                    unidade_medida,
                    valor_unidade,
                    valor_total,
                    peso
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 5)`,
                [
                    pedido_id,
                    item.codigoProduto,
                    item.nomeProduto,
                    item.quantidade,
                    item.unidadeMedida,
                    item.precoPelaUnidade,
                    item.totalProduto
                ]
            )
            await sleep(200)
            console.log(`Itens: ${item.nomeProduto}`)
        }
        await sleep(1000)
    }
    console.log('Nota Fenix Inserida com sucesso!!')
}

export default {
    adicionar_nota
}