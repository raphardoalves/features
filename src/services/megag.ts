const separarLinhaComissao = (texto: string) => {
    const linhas = texto.split('\n')

    const regexInicioRegistro = /^\d+\s+\d{2}\/\d{2}\/\d{4}/
    const regexLinhaComissao = /^\d+\s+\d{2}\/\d{2}\/\d{4}\s+\d{2}\/\d{2}\/\d{4}\s+\d+\s+\d{2}\/\d{2}\/\d{4}\s+.*?(?:R\$\s*)+\d{1,3}(?:\.\d{3})*,\d{2}\s+\d+(?:\.\d+)?\s*%\s+(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}\s+(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}.*/

    let buffer = ''
    let validos = []
    for (const linha of linhas) {
        const linhaLimpa = linha.trim()
        if (regexInicioRegistro.test(linhaLimpa)) {
            if (buffer) {
               regexLinhaComissao.test(buffer)
            }
            validos.push(linhaLimpa)
        } else {
            buffer += ' ' + linhaLimpa
        }
    }
    if (buffer) {
        regexLinhaComissao.test(buffer)
    }
    return validos
}
const separarCodigoComissao = (linhas: string[]) => {
    const regex = /^(\d+\s+\d{2}\/\d{2}\/\d{4}\s+\d{2}\/\d{2}\/\d{4}\s+\d+\s+)\d{2}\/\d{2}\/\d{4}.*?(\d+\s*[<>]?\s*%\s+R\$\s*-?\d[\d.,]*\s+R\$\s*-?\d[\d.,]*)$/
    let codigoComissao = []
    for(const linha of linhas) {
        const match = linha.match(regex)
        if (match) {
            const novaLinha = `${match[1]}${match[2]}`
            const semPorce = novaLinha.replace(/\d+\s*%/g, '')
            const semMoney = semPorce.replace(/R\$/g, '')
            const junto = semMoney.split(/\s+/).join(' ')
            const arrayText = junto.split(' ')
            codigoComissao.push({ nfe: arrayText[3], comissao: arrayText[4], bonus: arrayText[5]})
        }
    }

    const total_comissao = codigoComissao.reduce((acc, item) => acc + Number(item.comissao?.replace(",", '.')), 0)
    const total_bonus = codigoComissao.reduce((acc, item) => acc + Number(item.bonus?.replace(",", '.')), 0)
    console.log('Total Comissão: ', total_comissao)
    console.log('Total Bonus: ', total_bonus)
    console.log('Comissão + Bonus: ', total_bonus + total_comissao)
    return codigoComissao
}

export default {
    separarLinhaComissao,
    separarCodigoComissao
}