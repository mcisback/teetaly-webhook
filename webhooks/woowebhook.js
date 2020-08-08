// WooCommerce Webhook Receiver Class

const crypto = require("crypto")

const _Logger = require('../logger')
const Logger = new _Logger().getInstance()

// TO FIX
function WooVerifySignature(req, signature, sharedSecret) {
    let calculated_hmac = crypto
        .createHmac('sha256', sharedSecret)
        .update(req.rawBody)
        .digest('base64')

    Logger.log({
        msg: 'CALCULATED HMAC',
        calc: calculated_hmac,
        sign: signature,
        sharedSecret: sharedSecret,
        rawBody: req.rawBody
    })

    return signature === calculated_hmac
}

// TODO
/*
  @params metaArray:
    [
        {
            key1: metaKey1, //string
            value1: metaValue1 //string
        },
        key2 => value 2,
        ecc... (could be just a single value)
    ]
*/
function WooUpdateOrderMeta(WooCommerce, orderId, metaArray) {
    return WooCommerce.putAsync(`orders/${orderId}`, {
        meta_data: metaArray
    })
}

module.exports = {
    WooVerifySignature,
    WooUpdateOrderMeta 
}