export const imageToTextPrompt = () => {
    return `
        Te comportaras como un ocr y leereras la imagen que te entregue y retornaras los siguientes valores en un objecto,
        Si el commerce es redebank debes de retornar { 'Lo siento, pero no puedo procesar la imagen ya que el comercio es "Redeban" y según las instrucciones dadas, no debo leer la imagen porque no se trata de una factura.'},
        las key de los valores que vas a retornar son los siguientes y en el mismo orden despues estan los valores que debes obtener: commerce, numberInvoice, date, nit, total, product.
        Nombre de quien expide la factura, numero de factura, Fecha (Format: 2010-02-01 || ''), Nit, Total, Producto.

        En el mensaje de salida retorname solo el json con la informacion que necesito algo parecido a esto.
        Antes de entregarme la informacion rectifica la imange nuevamente para asegurar que la informacion sea correcta.
        El formato del total ser . para miles y , para decimales
    `
}