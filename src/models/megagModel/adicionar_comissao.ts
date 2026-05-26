import { conn_crm } from "../../conn/conn";
import megag from "../../services/megag";
import { main } from "../../execultar";
import ultius from "../../services/ultius";
import {join} from 'path'

const menu = `
|*************************************************************|

    Confirme os valores, Deseja proceguir?
    1 - Sim
    2 - Não
    
|*************************************************************|
`

export const adicionar_comissao_megag = async () => {
    const caminho = join(process.cwd(), 'src', 'ambiente', 'megag.pdf')
    const textoBruto = await ultius.extrairTextoBrutoPdf(caminho)
    const linhas = megag.separarLinhaComissao(textoBruto)
    const codigoComissao = megag.separarCodigoComissao(linhas)
    
    ultius.rl.question(menu, (opcao) => {
        const numero = Number(opcao);
        if(numero !== 1) return main()
        proceguir()
    })
    async function proceguir() {
        let cupomFiscal = []
        for(const linha of codigoComissao) {
            const nfe = Number(linha.nfe)
            const [pedido_id]: any = await conn_crm.execute(`SELECT id FROM pedido WHERE numero_nota = ? AND cnpj_fornecedor = '19043440000235'`, [nfe])
            const id = pedido_id[0]?.id ?? null
            if(id !== null) {
                const comissao = Number(linha.comissao?.replace(',', '.'))
                const bonus = Number(linha.bonus?.replace(',', '.'))
                await conn_crm.execute(`UPDATE pedido SET comissao_nota=?, comissao_bonus_megag=? WHERE id = ?`, [comissao, bonus, id])
                console.log('Inserindo Comissão: ', nfe)
            } else {
                cupomFiscal.push(nfe)
            }
            await ultius.sleep(400)
        }
        console.log(cupomFiscal)
        main()
    }
}
