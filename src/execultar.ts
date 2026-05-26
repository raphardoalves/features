
import { menuMegag } from "./controller/megagController/megagController";
import { menuFenix } from "./controller/fenixController/fenixController";
import { menuFicasa } from "./controller/fricasaController/fricasaController";
import { menuJampac } from "./controller/jampacController/jampacController";

import ultius from "./services/ultius";

export function main() {
const menu = `
|*************************************************************|

    Qual Fornecedor:
    1 - Fenix
    2 - Fricasa
    3 - Jampac
    4 - MegaG

|*************************************************************|
`
    ultius.rl.question(menu, (opcao) => {
        const numero = Number(opcao);
        switch(numero) {
            case 1: menuFenix()
                break
            case 2: menuFicasa()
                break
            case 3: menuJampac()
                break
            case 4: menuMegag()
                break
            default: 
                ultius.rl.close()
                console.log('Invalido')
        }
    })
}
main()