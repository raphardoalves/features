import fenix from '../../services/fenix'
import { conn_crm } from '../../conn/conn'
import { arrayCliente } from '../../services/fenix'
import ultius from '../../services/ultius'
import {join} from 'path'

export const adicionar_nota = async () => {
    const caminho = join(process.cwd(), 'src', 'ambiente', 'fenix.pdf')
    const textoBruto = await ultius.extrairTextoBrutoPdf(caminho)
    const textoLimpo = fenix.limparTexto(textoBruto)
    const relatorio = fenix.extrairNotasFiscais(textoLimpo)
    const notas = relatorio.notas
    const totalNota = notas.reduce((acc, item) => acc + Number(item.totalNota.replace('.', '').replace(',', '.')), 0)
    console.log(totalNota)
   
    for(let i in notas) {
       
    
        const codigo_string = String(notas[i]?.codigoCliente)
        const cnpj = arrayCliente[codigo_string as keyof typeof arrayCliente]

        const numeroNota = notas[i]?.codigoNotaFiscal
        const comissao = notas[i]?.comissaoNota || 0

        const [dia, mes, ano]: any = notas[i]?.dataFaturamento.split('/')
        const data_mysql = `${ano}-${mes}-${dia}`;
        
        if (!numeroNota || !cnpj) {
            console.log(`Nome: ${notas[i]?.codigoCliente}, Codigo: ${notas[i]?.nomeCliente} - SEM CNPJ`)
            continue
        }

        const [idLeadRepresentante]: any[] = await conn_crm.execute(`SELECT leads.id, leads.representante_id FROM leads INNER JOIN prospects p ON prospect_id = p.id WHERE p.cnpj = ?`, [cnpj])
        const id_lead = idLeadRepresentante[0]?.id || null
        const idRepresentante = idLeadRepresentante[0]?.representante_id || null

        const [retorno]: any = await conn_crm.execute(
            `INSERT INTO pedido (
                cnpj_fornecedor, 
                tipo, 
                numero_nota, 
                cnpj_cliente, 
                comissao_nota, 
                data_faturado,
                leads_id,
                representante_id
            ) VALUES ('17257812000110','VENDA',?,?,?,?,?,?)`, 
            [
                numeroNota, 
                cnpj, 
                comissao,
                data_mysql,
                id_lead,
                idRepresentante
            ])
        console.log(`-----------------------------------------------------------------`)
        console.log(` - Criando nota: ${numeroNota} Cliente: ${notas[i]?.nomeCliente}`)

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
            await ultius.sleep(200)
            console.log(`| Itens: ${item.nomeProduto} `)
        }
        console.log(`-----------------------------------------------------------------`)
        await ultius.sleep(1000)
    }
    console.log('Nota Fenix Inserida com sucesso!!')
}
