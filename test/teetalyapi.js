// Test TeetalyApi Module
const assert = require('assert')

const config = {
    live: {
        api_key: ''
    },
    test: {
        api_key: 'Fd+F1OZG0fVQsIPSRxIajg==',
        teetaly_order_id_meta_key: 'teetaly_order_id',
        teetaly_order_items_meta_key: 'teetaly_order_items',
        teetaly_order_notes_meta_key: 'teetaly_order_notes', 
    }
}
const TeetalyApi = require('../teetalyapi')

const teetalyApi = new TeetalyApi( config.test.api_key )

const _Logger = require('../logger')
const Logger = new _Logger().getInstance()

const { TeetalySendOrder } = require('../webhooks/wooorder')

const WooTestData = require('../webhooks/wootestdata')
const fetchProducts = require('../webhooks/fetchproducts')

const WooApi = require('../wooapi')
const WooCommerce = new WooApi().getInstance()

const { WooUpdateOrderMeta } = require('../webhooks/woowebhook')

let teetalyCountry;
let teetalyCountryId;
let wooWebhookDataJSON = WooTestData.wooWebhookDataJSON

function makeRandomString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

async function TestWooUpdateOrderMeta () {
    const wooOrderId = '4840';
    const teetalyOrderIdNew = makeRandomString(4);
    const teetalyOrderNotesNew = makeRandomString(12);

    const wooMetaData = await WooCommerce.getAsync(`orders/${wooOrderId}`)
        .then(resp => JSON.parse(resp.toJSON().body))
        .then(resp => resp.meta_data)
        .then(meta_data => {
            console.log(`WooCommerce Order#${wooOrderId} before WooUpdateOrderMeta`)
            return meta_data
        })
        .catch(err => {
            console.log('TEST FAILED')
            console.log(`WooCommerce Order#${wooOrderId} before error: `, err)
            return err
        })

    const teetalyOrderIdBefore = wooMetaData.filter(el => el.key === config.test.teetaly_order_id_meta_key)[0]
    const teetalyOrderNotesBefore = wooMetaData.filter(el => el.key === config.test.teetaly_order_notes_meta_key)[0]

    console.log({
        wooOrderId: wooOrderId,
        teetalyOrderIdNew: teetalyOrderIdNew,
        teetalyOrderIdBefore: teetalyOrderIdBefore,
        teetalyOrderNotesNew: teetalyOrderNotesNew,
        teetalyOrderNotesBefore: teetalyOrderNotesBefore,
        wooMetaData: wooMetaData
    })

    await WooUpdateOrderMeta(
        WooCommerce,
        wooOrderId,
        [
            {
                key: config.test.teetaly_order_id_meta_key,
                value: teetalyOrderIdNew
            },
            {
                key: config.test.teetaly_order_notes_meta_key,
                value: teetalyOrderNotesNew
            }
        ])
    .then(resp => JSON.parse(resp.toJSON().body))
    .then(resp => resp.meta_data)
    .then(meta_data => {
        const teetalyOrderIdAfter = meta_data.filter(el => el.key === config.test.teetaly_order_id_meta_key)[0]
        const teetalyOrderNotesAfter = meta_data.filter(el => el.key === config.test.teetaly_order_notes_meta_key)[0]

        console.log({
            msg: 'WooUpdateOrderMeta success',
            wooOrderId: wooOrderId,
            teetalyOrderIdNew: teetalyOrderIdNew,
            teetalyOrderIdBefore: teetalyOrderIdBefore,
            teetalyOrderIdAfter: teetalyOrderIdAfter,
            teetalyOrderNotesNew: teetalyOrderNotesNew,
            teetalyOrderNotesBefore: teetalyOrderNotesBefore,
            teetalyOrderNotesAfter: teetalyOrderNotesAfter,
            wooMetaData: wooMetaData
        })

        if(teetalyOrderIdNew === teetalyOrderIdAfter.value) {
            console.log('TEST SUCCESS')
            console.log('teetalyOrderId Match')

            if(teetalyOrderNotesNew === teetalyOrderNotesAfter.value) {
                console.log('TEST SUCCESS')
                console.log('teetalyOrderNotes Match')
            } else {
                console.log('TEST FAILED')
                console.log('teetalyOrderNotes Mismatch')
            }
        } else {
            console.log('TEST FAILED')
            console.log('teetalyOrderId Mismatch')
        }
    })
    .catch(err => {
        console.log('TEST FAILED')
        console.log({
            msg: 'WooUpdateOrderMeta err',
            err: err
        })
        return err
    })
}

TestWooUpdateOrderMeta()


/* fetchProducts(WooTestData.line_items).then(postData => {
    Logger.dir({
        msg: 'postData inside .then',
        postData: postData,
        orderItem: postData.orderItem
    })

    TeetalySendOrder(teetalyApi, teetalyConfig, WooCommerce, Logger, postData, wcOrderId)
}) */
