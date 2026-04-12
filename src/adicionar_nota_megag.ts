import fs from 'fs'
import path from 'path';
import { join } from 'path';
import { conn } from './conn/conn';
import { parseStringPromise } from 'xml2js';

async function transferir(filePath: string) {
    const xmlData = fs.readFileSync(filePath, 'utf-8');
    const result = await parseStringPromise(xmlData, { explicitArray: false });

    const nfe = result.NFe.infNFe;
    const numeroNota = nfe.ide.nNF;
    const tipo = nfe.ide.natOp;
    let peso = 0 
    if(!['DEVOLUCAO', 'BONIFICACAO', 'BRINDE'].includes(tipo)) {
        peso = nfe.transp.vol.pesoB 
    }
    const dataFaturado = nfe.ide.dhEmi.split('T')[0]; 
    const cnpjCliente = nfe.dest.CNPJ || nfe.dest.CPF;
    
    const [retorno]: any[] = await conn.execute(`SELECT leads.id FROM leads INNER JOIN prospects p ON prospect_id = p.id WHERE p.cnpj = ?`, [cnpjCliente])
    const id_lead = retorno[0]?.id || null
    const [insert]: any[] = await conn.execute(`INSERT INTO pedido (numero_nota, leads_id, cnpj_cliente, tipo, data_faturado) VALUES (?,?,?,?,?)`, [numeroNota, id_lead, cnpjCliente, tipo, dataFaturado])
    const idPedido = insert.insertId
    
    const produtos = Array.isArray(nfe.det) ? nfe.det : [nfe.det];

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
    }
    return
}

const xml_pasta = join(process.cwd(), 'src', 'ambiente')
async function main() {
    //aqui ele pegou somente os arquivos
    const files = fs.readdirSync(xml_pasta).filter(f => f.endsWith('.xml'));
    for (const file of files) {
        //aqui ele juntou o nome da pasta para referenciar o arquivo
        const filePath = path.join(xml_pasta, file);
        await transferir(filePath);
    }
    console.log('Todos os arquivos foram processados!');
}

main();
