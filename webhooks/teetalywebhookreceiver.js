const WooApi = require('../wooapi')
const WooCommerce = new WooApi().getInstance()

const _Logger = require('../logger')
const Logger = new _Logger().getInstance()

// You need to do let _var = new TeetalyApi('api_key') ecc...
//const TeetalyApi = require('../teetalyapi')

// Maybe this webhook should be better to be written inside WooCommerce
// It is more practical
function TeetalyWebhookReceiver(req, res) {
    let headers = req.headers
    let order = req.body
    let WooConfig = WooCommerce.getConfig()

    Logger.dir({
        msg: `FDP TeetalyWebhookReceiver: Received A New Webhook`,
        headers: headers,
        body: order
    })

    /*
    {
        "OrderId": 3963,
        "OrderStatusId": 10,
        "OrderStatus": "Completed",
        "Note": ""
    }
    */

    Logger.log({
        msg: 'TeetalyWebhookReceiver: Request Is Correct',
        code: 200
    })

    res.status(200).send({
        msg: 'Request Is Correct'
    })
}

module.exports = {
    TeetalyWebhookReceiver
}