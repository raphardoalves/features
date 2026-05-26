import { adicionar_comissao_megag } from "../../models/megagModel/adicionar_comissao";
import { adicionar_nota } from "../../models/megagModel/adicionar_nota";
import { atualizar_tabela } from "../../models/megagModel/atualizar_tabela_produto";
import ultius from "../../services/ultius";
import { main } from "../../execultar";

export function menuMegag() {
    const menu = `
|*************************************************************|

    Qual Feature deseja execultar (Megag):
    1 - Adicionar nota
    2 - Adicionar comissão
    3 - Atualizar Tabela dos Produtos
    4 - Retornar
    
|*************************************************************|
    `
    ultius.rl.question(menu, (opcao) => {
        const numero = Number(opcao);
        switch(numero) {
            case 1: adicionar_nota()
                break
            case 2: adicionar_comissao_megag()
                break
            case 3: atualizar_tabela()
                break
            case 4: main()
                break
            default:
                ultius.rl.close()
                console.log('Invalido')
        }
    })
} 


