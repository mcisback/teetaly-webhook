async function fetchProducts(wcProducts, postData, teetalyApi, Logger) {
    for await (let wcProduct of wcProducts) {
        // Should not be stuck inside .then hell in theory
        let teetalyProduct = await teetalyApi.getProductDetailsBySku( wcProduct.sku )
            .then(res => res.data.productsDetail[0])
            .catch(err => {
                console.log('teetalyApi.getProductDetailsBySku Error: ', err.response)

                return [
                    err,
                    false
                ]
            })

        console.log({
            teetalyProduct: teetalyProduct,
            wcProductSku: wcProduct.sku,
        })

        if( teetalyProduct[1] === false ) {
            return Promise.reject({
                errType: 'teetaly_product',
                errResponse: teetalyProduct[0].response,
                wcProductSku: wcProduct.sku
            })
        }

        console.log('wcProduct.meta_data 1: ', wcProduct.meta_data)

        // TODO: check if size is present
        let wcProductSize = wcProduct.meta_data.filter(el => el.key === 'pa_size')[0].value.toUpperCase()
        
        // TODO: check if color is present
        let wcProductColor = wcProduct.meta_data.filter(el => el.key === 'pa_color')[0].value.replace(/(^\w|\s\w)/g, m => m.toUpperCase())

        Logger.log({
            msg: 'wcProduct pa_size+pa_color',
            wcProductColor: wcProductColor,
            wcProductSize: wcProductSize
        })
    
        // TODO: check if color is present
        let color = teetalyProduct.colors.filter(el => el.name === wcProductColor)[0]

        if(!color) {
            return Promise.reject({
                errType: 'color_mismatch',
                wcProductColor: wcProductColor,
                teetalyProductColors: teetalyProduct.colors,
                wcProductSku: wcProduct.sku
            })
        }

        console.log('color: ', color)
        console.log('color.id: ', color.id)
    
        // TODO: check if size is present
        let size = Object.keys(teetalyProduct.sizes)
            .find(key => teetalyProduct.sizes[key] === wcProductSize)
        
        if(!size) {
            return Promise.reject({
                errType: 'size_mismatch',
                wcProductSize: wcProductSize,
                teetalyProductSizes: teetalyProduct.sizes,
                wcProductSku: wcProduct.sku
            })
        }

        console.log('size: ', size)

        postData.orderItem.push({
            productId: teetalyProduct.id,
            quantity: wcProduct.quantity,
            sizeId: size,
            tipo: teetalyProduct.tipo,
            colorId: color.id,
            customReference: wcProduct.sku
        })

        Logger.dir({
            msg: 'Adding Product ' + wcProduct.sku,
            teetalyProduct: teetalyProduct,
            wcProduct: wcProduct,
            color: color,
            size: size,
            wcProductColor: wcProductColor,
            wcProductSize: wcProductSize,
            postData: postData
        })
    }

    return Promise.resolve(postData)

}

module.exports = {
    fetchProducts
}