import fs from 'fs'
import path from 'path';
import { join } from 'path';
import { conn } from './conn/conn';
import { parseStringPromise } from 'xml2js';
import xlsx from "xlsx";


const xml_pasta = join(process.cwd(), 'src', 'ambiente', 'xml')
async function transferir(filePath: string) {
    const xmlData = fs.readFileSync(filePath, 'utf-8');
    const result = await parseStringPromise(xmlData, { explicitArray: false });

    const nfe = result.NFe.infNFe;
    const numeroNota = nfe.ide.nNF;
    const tipo = nfe.ide.natOp;
    let peso = 0 
    if(nfe.transp.vol) {
        peso = nfe.transp.vol.pesoB
    }
    const dataFaturado = nfe.ide.dhEmi.split('T')[0]; 
    const cnpjCliente = nfe.dest.CNPJ || nfe.dest.CPF;
    
    const [retorno]: any[] = await conn.execute(`SELECT leads.id FROM leads INNER JOIN prospects p ON prospect_id = p.id WHERE p.cnpj = ?`, [cnpjCliente])
    const id_lead = retorno[0]?.id || null
    const [insert]: any[] = await conn.execute(`INSERT INTO pedido (numero_nota, leads_id, cnpj_cliente, tipo, data_faturado, cnpj_fornecedor) VALUES (?,?,?,?,?,'19043440000235')`, [numeroNota, id_lead, cnpjCliente, tipo, dataFaturado])
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

async function adicionar_nota() {
    //aqui ele pegou somente os arquivos
    const files = fs.readdirSync(xml_pasta).filter(f => f.endsWith('.xml'));
    for (const file of files) {
        //aqui ele juntou o nome da pasta para referenciar o arquivo
        const filePath = path.join(xml_pasta, file);
        await transferir(filePath);
    }
    console.log('Todos os arquivos foram processados!');
}
const atualizar_tabela = async () => {
    const caminho = join(process.cwd(), 'src', 'ambiente', 'arquivo.xlsx') 
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
    
    for(let i in dados) {
        const [incluso]: any[] = await conn.query(`SELECT codigo FROM produto WHERE codigo = ?`, [dados[i].codigo]) 
        const codigo = incluso[0] || false
        const [dia, mes, ano] = dados[i].validade.split('/')
        const data_mysql = `${ano}-${mes}-${dia}`;
        if(!codigo) {
            await conn.execute('INSERT INTO produto (codigo, nome, valor, estoque, validade) VALUES (?,?,?,?,?)', [ 
                dados[i].codigo,
                dados[i].nome,
                dados[i].valor,
                dados[i].estoque,
                data_mysql
            ])
        } else {
            await conn.execute('UPDATE produto SET valor=?, estoque=?, validade=? WHERE codigo = ?', [dados[i].valor, dados[i].estoque, data_mysql, dados[i].codigo])
        }
    }
    console.log('Tabela Atualizada Com Sucesso!!')
}

export default {
    adicionar_nota,
    atualizar_tabela
}