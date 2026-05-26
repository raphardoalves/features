import {conn_loja} from '../../conn/conn';
import {join} from 'path'
import xlsx from "xlsx";

export const atualizar_tabela = async () => {
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
        const [incluso]: any[] = await conn_loja.query(`SELECT codigo FROM produto WHERE codigo = ?`, [dados[i].codigo]) 
        const codigo = incluso[0] || false
        const [dia, mes, ano] = dados[i].validade.split('/')
        const data_mysql = `${ano}-${mes}-${dia}`;
        if(!codigo) {
            await conn_loja.execute('INSERT INTO produto (codigo, nome, valor, estoque, validade) VALUES (?,?,?,?,?)', [ 
                dados[i].codigo,
                dados[i].nome,
                dados[i].valor,
                dados[i].estoque,
                data_mysql
            ])
        } else {
            await conn_loja.execute('UPDATE produto SET valor=?, estoque=?, validade=? WHERE codigo = ?', [dados[i].valor, dados[i].estoque, data_mysql, dados[i].codigo])
        }
    }
    console.log('Tabela Atualizada Com Sucesso!!')
}
