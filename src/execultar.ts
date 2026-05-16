import megag from "./megag";
import fenix from "./fenix";
import fricasa from "./fricasa";
import jampac from "./jampac";
import * as readline from "readline";

const menu = `
|*************************************************************|

    Qual Feature deseja execultar:
    1 - Adicionar nota Fenix
    2 - Adicionar nota Fricasa
    3 - Adicionar nota Jampac
    4 - Adicionar nota MegaG
    5 - Adicionar Produto MegaG

|*************************************************************|
`
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

rl.question(menu, (opcao) => {
    const numero = Number(opcao);
    switch(numero) {
        case 1: fenix.adicionar_nota()
            break
        case 2: fricasa.adicionar_nota()
            break
        case 3: jampac.adicionar_nota()
            break
        case 4: megag.adicionar_nota()
            break
        case 5: megag.atualizar_tabela()
            break
        default:
            console.log('Invalido')
    }
    rl.close()
})