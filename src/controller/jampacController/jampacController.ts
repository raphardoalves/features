import { adicionar_nota } from "../../models/jampacModel/adicionar_nota";
import ultius from "../../services/ultius";
import { main } from "../../execultar";

export function menuJampac() {
    const menu = `
|*************************************************************|

    Qual Feature deseja execultar (Jampac):
    1 - Adicionar nota
    2 - Retornar
    
|*************************************************************|
    `
    ultius.rl.question(menu, (opcao) => {
        const numero = Number(opcao);
        switch(numero) {
            case 1: adicionar_nota()
                break
            case 2: main()
                break
            default:
                ultius.rl.close()
                console.log('Invalido')
        }
    })
} 
