import { parseStringPromise } from 'xml2js'
import xlsx from 'xlsx'
import { join } from 'path'
import { conn } from './conn/conn';
import path from 'path';
//testando git
const adicionar_nota_fricasa = async (caminho: string) => {
    const reponse = await fetch(caminho)
    const xml = await reponse.text()
    const json = await parseStringPromise(xml, { explicitArray: false });

    const nfe = json.nfeProc.NFe.infNFe;
    const numeroNota = nfe.ide.nNF;
    const tipo = nfe.ide.natOp.toUpperCase();
    const fornecedor = nfe.emit.CNPJ;
    let peso = 0;
    if(nfe.transp.vol) {
        peso = nfe.transp.vol.pesoB 
    }
    const dataFaturado = nfe.ide.dhEmi.split('T')[0]; 
    const cnpjCliente = nfe.dest.CNPJ || nfe.dest.CPF;

    const [retorno]: any[] = await conn.execute(`SELECT leads.id FROM leads INNER JOIN prospects p ON prospect_id = p.id WHERE p.cnpj = ?`, [cnpjCliente])
    const id_lead = retorno[0]?.id || null

    const [insert]: any = await conn.execute(`INSERT INTO pedido (numero_nota, leads_id, cnpj_cliente, cnpj_fornecedor, tipo, data_faturado) VALUES (?,?,?,?,?,?)`, [numeroNota, id_lead, cnpjCliente, fornecedor, tipo, dataFaturado])
    const idPedido = insert.insertId

    const produtos = Array.isArray(nfe.det) ? nfe.det : [nfe.det]

    const pesoTotal = Number(peso) || 0;
    const quantidadeItens = produtos.length || 1;
    const pesoPorItem = pesoTotal / quantidadeItens;

    for (const item of produtos) {
        const prod = item.prod;
      
        await conn.execute(
            `INSERT INTO produtos_nota 
            (id_pedido, codigo_produto, nome_produto, quantidade, unidade_medida, valor_unidade, valor_total, peso)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                idPedido,
                prod.cProd,
                prod.xProd,
                parseFloat(prod.qCom),
                prod.uCom,
                parseFloat(prod.vUnCom),
                parseFloat(prod.qCom) * parseFloat(prod.vUnCom),
                pesoPorItem 
            ]
        );
        console.log('Inserindo Produtos')
    }
    return
}
const main = async () => {
    const caminho = join(process.cwd(), 'src', 'ambiente', 'fricasa.xlsx')
    const workbook = xlsx.readFile(caminho);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[String(sheetName)];
    if(!sheet) {
        return console.log('sem folha')
    }
    const dados: any[] = xlsx.utils.sheet_to_json(sheet); 

    for(const i in dados) {
        await adicionar_nota_fricasa(dados[i].url) 
        console.log(`Processados: ${i}`)
    }
    console.log('Notas Fricasa adicionada com Sucesso!')
}
main()