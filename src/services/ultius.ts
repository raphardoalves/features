import * as pdfjsLib from 'pdfjs-dist'
import * as readline from "readline";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

async function extrairTextoBrutoPdf(caminho: string): Promise<string> {
    const loadTask = pdfjsLib.getDocument(caminho)
    const document = await loadTask.promise
    let resultadoFinal = ''
    for (let numeroPagina = 1; numeroPagina <= document.numPages; numeroPagina++) {
        const page = await document.getPage(numeroPagina)
        const textoPagina = await page.getTextContent()
        const items = textoPagina.items.map((item: any) => {
            const [, , , , x, y] = item.transform
            return { texto: item.str, x, y} 
        })
        const linhas: any[] = []
        items.forEach((item) => {
            const linhaExistente = linhas.find(l => Math.abs(l.y - item.y) < 5 )
            if (linhaExistente) {
                linhaExistente.itens.push(item)
            } else {
                linhas.push({ y: item.y, itens: [item] })
            }
        })
        const resultadoPagina = linhas.sort((a, b) => b.y - a.y).map(linha => linha.itens.sort((a: any, b: any) => a.x - b.x).map((i: any) => i.texto).join(' ')).join('\n')
        resultadoFinal += resultadoPagina + '\n'
    }
    return resultadoFinal
}
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default {
    extrairTextoBrutoPdf,
    sleep,
    rl
}