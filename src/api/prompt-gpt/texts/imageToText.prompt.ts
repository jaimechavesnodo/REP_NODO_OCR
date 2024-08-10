export const imageToTextPrompt = () => {
    return `
        Te comportaras como un ocr y leereras la imagen que te entregue y retornaras los siguientes valores en un objecto,
        las key de los valores que vas a retornar son los siguientes y en el mismo orden despues estan los valores que debes obtener: commerce, numberInvoice, date, nit, total, product.
        Nombre de quien expide la factura, numero de factura, Fecha, Nit, Total, Producto.

        En el mensaje de salida retorname solo el json con la informacion que necesito algo parecido a esto.
        Antes de entregarme la informacion rectifica la imange nuevamente para asegurar que la informacion sea correcta.
        El formato del total ser . para miles y , para decimales
    `
}