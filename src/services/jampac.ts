import xlsx from "xlsx";

export function get_cnpj(caminho: string) {
    const workbook = xlsx.readFile(caminho);
    const sheetName = workbook.SheetNames[1]
    if(!sheetName) {
        throw new Error('Resultado Linha Undefined')
    }
    const sheet = workbook.Sheets[sheetName];
    if(!sheet) {
        throw new Error('Resultado Linha Undefined')
    }
    const dados: any[] = xlsx.utils.sheet_to_json(sheet);

    return dados[0]
}
