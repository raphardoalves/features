import { conn_crm } from "../../conn/conn";
import { join } from 'path'
import xlsx from "xlsx";
import { get_cnpj } from "../../services/jampac";

export const adicionar_nota = async () => {
    const caminho = join(process.cwd(), 'src', 'ambiente', 'jampac.xlsx')
    const data_cliente = get_cnpj(caminho)
    const workbook = xlsx.readFile(caminho);
    const sheetName = workbook.SheetNames[0];
    if(!sheetName) {
        throw new Error('Resultado Linha Undefined')
    }
    const sheet = workbook.Sheets[sheetName];
    if(!sheet) {
        throw new Error('Resultado Linha Undefined')
    }
    const dados: any[] = xlsx.utils.sheet_to_json(sheet);

    let referencia: any[] = []

    for(let i in dados) {
        const [dia, mes, ano] = dados[i].data_faturado.split('/')
        const data_mysql = `${ano}-${mes}-${dia}`;
        const cnpj = data_cliente[dados[i].cod_cliente]
        if(!cnpj) return console.log('Sem Cnpj')
        if(!referencia.includes(dados[i].numero_nota)) {
            const [retorno]: any[] = await conn_crm.execute(`SELECT leads.id FROM leads INNER JOIN prospects p ON prospect_id = p.id WHERE p.cnpj = ?`, [cnpj])
            const id_lead = retorno[0]?.id || null
            await conn_crm.execute('INSERT INTO pedido (leads_id, numero_nota, cnpj_cliente, cnpj_fornecedor, tipo, data_faturado) VALUES (?, ?, ?, ?, ?, ?)', [id_lead, 
                dados[i].numero_nota,
                cnpj,
                '07235232000178',
                dados[i].tipo,
                data_mysql
            ])
            referencia.push(dados[i].numero_nota)
        }
    }
    for(let i in dados) {
        await conn_crm.execute(`INSERT INTO produtos_nota (id_pedido, codigo_produto, nome_produto, quantidade, unidade_medida, valor_unidade, valor_total, peso) 
            SELECT id, ?, ?, ?, ?, ?, ?, ? FROM pedido WHERE numero_nota = ?`, [dados[i].codigo_produto,
            dados[i].nome_produto,
            dados[i].quantidade,
            dados[i].unidade_medida,
            dados[i].valor_unidade,
            dados[i].valor_total,
            dados[i].peso,
            dados[i].numero_nota,
        ])
    }
    console.log("Nota Fiscal Inserida No Banco de dados!!")
}