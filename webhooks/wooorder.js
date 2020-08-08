const TeetalyApi = require('../teetalyapi')

const { WooVerifySignature, WooUpdateOrderMeta } = require('./woowebhook')

const WooTestData = require('./wootestdata')

const { fetchProducts } = require('./fetchproducts')

const { sendError } = require('../senderror')

function WooProcessWebhookData(teetalyApi, teetalyConfig, Logger, wcData, WooCommerce, nodeResponse) {

    //let wcOrderKey = wcData.order_key
    let wcOrderId = wcData.id
    //customerId = wcData.customer_id
    //orderObj = wc_get_order( intval( order_id ) )
    //user = orderObj->get_user()
    //userId = orderObj->get_user_id()
    //let products = wcData.line_items // Ordered Products
    let billAddress = wcData.billing
    //let shipAddress = wcData.shipping
    let wcCountry = billAddress.country // Stato
    // Provincia
    let wcState = billAddress.state

    teetalyApi.getCountryByTwoLetterIsoCode( wcCountry )
    .then(res => res.data)
    .then(teetalyCountry => {
        Logger.dir({
            msg: 'teetalyApi.getCountryByTwoLetterIsoCode OK',
            teetalyCountry: teetalyCountry
        })

        teetalyApi.getStateByCountryId( teetalyCountry.Id )
        .then(res2 => res2.data)
        .then(teetalyStateList => {
            Logger.dir({
                msg: 'teetalyApi.getStateByCountryId OK',
                wcState: wcState,
                teetalyStateList: teetalyStateList
            })

            let teetalyState = teetalyStateList.filter(el => el.Abbreviation === wcState)[0]

            Logger.dir({
                msg: 'teetalyStateList.filter',
                wcState: wcState,
                teetalyState: teetalyState
            })

            var postData = {
                shippingAddress: {
                    FirstName: billAddress.first_name,
                    LastName: billAddress.last_name,
                    Email: billAddress.email,
                    CountryId:  teetalyCountry.Id,
                    StateProvinceId: teetalyState.Id,
                    City: billAddress.city,
                    AddressOne: billAddress.address_1,
                    AddressTwo: billAddress.address_1,
                    ZipPostalCode: billAddress.postcode,
                    PhoneNumber: billAddress.phone,
                    FaxNumber: ''
                },
                orderItem: []
            }

            let skus = []

            // Test Env
           /*  if(teetalyConfig.api_env === 'test') {
                
                skus = WooTestData.line_items

            // TODO: Live Env
            } else if(teetalyConfig.api_env === 'live') {

                skus = wcData.line_items

            } */

            // When ordering without test data, but with real data
            skus = wcData.line_items

            Logger.log({
                msg: 'postData before fetchProducts',
                postData: postData,
                wcProducts: wcData.line_items,
                skus: skus
            })

            fetchProducts(skus, postData, teetalyApi, Logger)
                .then(postData => {
                    Logger.dir({
                        msg: 'postData fetchProducts OK',
                        postData: postData,
                        orderItem: postData.orderItem
                    })

                    TeetalySendOrder(
                        teetalyApi,
                        teetalyConfig,
                        WooCommerce,
                        Logger,
                        postData,
                        wcOrderId,
                        nodeResponse
                    )
                })
                .catch(err => {
                    if(err.errType === 'teetaly_product') {
                        sendError({
                            msg: 'fetchProducts err',
                            errType: err.errType,
                            errStatus: err.errResponse.status,
                            errStatusText: err.errResponse.statusText,
                            errData: err.errResponse.data,
                            wcProductSku: err.wcProductSku,
                            wcOrderId: wcOrderId,
                        }, err.status ? err.status : 500, nodeResponse)
                    } else if(err.errType === 'color_mismatch') {
                        sendError({
                            msg: 'fetchProducts err',
                            errType: err.errType,
                            wcProductColor: err.wcProductColor,
                            teetalyProductColors: err.teetalyProductColors,
                            wcProductSku: err.wcProductSku,
                            wcOrderId: wcOrderId,
                        }, 500, nodeResponse)
                    } else if(err.errType === 'size_mismatch') {
                        sendError({
                            msg: 'fetchProducts err',
                            errType: err.errType,
                            wcProductSize: err.wcProductSize,
                            teetalyProductSizes: err.teetalyProductSizes,
                            wcProductSku: err.wcProductSku,
                            wcOrderId: wcOrderId,
                        }, 500, nodeResponse)
                    } else {
                        sendError({
                            msg: 'fetchProducts err',
                            errType: 'Unknown Error',
                            err: err,
                            wcOrderId: wcOrderId,
                        }, 500, nodeResponse)
                    }
                })

        })
        .catch(err => sendError({
            msg: 'teetalyApi.getStateByCountryId err',
            err: err
        }, 500, nodeResponse))
    })
    .catch(err => sendError({
        msg: 'teetalyApi.getCountryByTwoLetterIsoCode err',
        err: err
    }, 500, nodeResponse))
}

function TeetalySendOrder(teetalyApi, teetalyConfig, WooCommerce, Logger, postData, wcOrderId, nodeResponse) {
    Logger.log({
        msg: 'TeetalySendOrder: postData Before createOrder',
        postData: postData,
        teetalyConfig: teetalyConfig
    })

    teetalyApi.createOrder(postData)
        .then(resp => resp.data)
        .then(teetalyOrder => {
            Logger.log({
                msg: 'TeetalySendOrder: teetalyOrder createOrder OK',
                teetalyOrder: teetalyOrder
            })

            WooUpdateOrderMeta(
                WooCommerce,
                wcOrderId,
                [
                    {
                        key: teetalyConfig.order_id_meta_key,
                        value: teetalyOrder.OrderId
                    },
                    {
                        key: teetalyConfig.order_items_meta_key,
                        value: JSON.stringify( teetalyOrder.OrderItemids )
                    }
                ])
                .then(resp => JSON.parse(resp.toJSON().body))
                .then(resp => resp.meta_data)
                .then(meta_data => {
                    
                    Logger.log({
                        msg: 'Updating WooCommerce Order Meta Keys Partial Resp',
                        wcOrderId: wcOrderId,
                        teetalyConfig: teetalyConfig,
                        teetalyOrder: teetalyOrder,
                        wooResp: meta_data
                    })
                    
                    teetalyApi.setOrderPrintable( OrderId )
                    .then(resp => {
                        Logger.log({msg: 'setOrderPrintable OK, resp: ', resp: resp})

                        nodeResponse.status(200).send({
                            msg: 'Order Done',
                            resp: resp
                        })
                    })
                    .catch(err => {
                        sendError({msg: 'setOrderPrintable Err: ', err: err}, 500, nodeResponse)
                    })
                })
                .catch(err => {
                    sendError({
                        msg: 'WooUpdateOrderMeta err',
                        err: err
                    }, 500, nodeResponse)

                    return err
                })
        })
        .catch(err => sendError({
            msg: 'TeetalySendOrder: teetalyApi.createOrder err',
            err: err
        }, 500, nodeResponse))
}

function WooOrderWebhook(req, res, Logger, WooCommerce) {
    let headers = req.headers
    let wcData = req.body
    let WooConfig = WooCommerce.getConfig()

    Logger.log({
        msg: `FDP WooOrderWebhook: Received A New Webhook`,
        headers: headers,
        body: wcData
    })

    let wcTopic = headers['x-wc-webhook-topic']
    let wcSource = headers['x-wc-webhook-source']
    let wcSignature = headers['x-wc-webhook-signature']

    Logger.log({
        msg: 'WooOrderWebhook: TOPIC/SOURCE/SIGNATURE',
        wcTopic: wcTopic,
        wcSource: wcSource,
        wcSignature: wcSignature,
        reqQuery: req.query
    })

    if( !req.query.hasOwnProperty('nosignature') ) {
        
        // Verify WooCommerce Signature
        if( !WooVerifySignature( req, wcSignature, WooConfig.webhookSecretKey ) ) {
            Logger.log( {msg: 'WooOrderWebhook Error: Incorrect Signature'} )

            // Send 403 And Exit
            return res.status(403).send({ error: 'Incorrect Signature' }).end()
        }

    } else {
        Logger.log({msg: 'WooOrderWebhook: Skipping WooCommerce Webhook Verification Process'})
    }

    // Should be only updated
    // Should include all allowed sources
    //teetalyConfig.api_env === 'test'

    let teetalyConfig = {
        api_env: headers['x-teetaly-api-env'],
        api_key: headers['x-teetaly-api-key'],
        order_id_meta_key: headers['x-order-id-meta-keys'],
        order_items_meta_key: headers['x-order-items-meta-keys'],
        order_notes_meta_key: headers['x-order-notes-meta-keys'],
    }

    res.status(200).send({
        msg: 'Debug',
        teetalyConfig
    }).end()
    //

    let pass = false

    if(
        ( wcTopic === 'order.created' || wcTopic === 'order.updated' )
        && wcSource.includes('figlidiputin.it')
        && teetalyConfig.api_env === 'test'
    ) {
        pass = true

        Logger.log({
            msg: 'Webhook Pass ? PASS',
            wcTopicAllowed: 'order.created || order.updated',
            wcSourceAllowed: 'figlidiputin.it',
            env: teetalyConfig.api_env,
            wcTopic: wcTopic,
            wcSource: wcSource,
            pass: pass
        })
    } else if (
        ( wcTopic === 'order.created' )
        && wcSource.includes('figlidiputin.it')
        && teetalyConfig.api_env === 'live'
    ) {
        pass = true

        Logger.log({
            msg: 'Webhook Pass ? PASS',
            wcTopicAllowed: 'order.created',
            wcSourceAllowed: 'figlidiputin.it',
            env: teetalyConfig.api_env,
            wcTopic: wcTopic,
            wcSource: wcSource,
            pass: pass
        })
    } else {
        Logger.log({
            msg: 'Webhook Pass ? NOPE',
            wcTopicAllowed: teetalyConfig.api_env === 'test' ? 'order.created || order.updated' : 'order.created',
            wcSourceAllowed: 'figlidiputin.it',
            env: teetalyConfig.api_env,
            wcTopic: wcTopic,
            wcSource: wcSource,
            pass: pass
        })
    }

    if( pass === true ) {
        Logger.log({
            msg: 'WooOrderWebhook: Woo Request Is Correct',
            code: 200
        })

        Logger.log({
            msg: 'WooOrderWebhook: Received Teetaly Config',
            teetalyConfig: teetalyConfig
        })

        const teetalyApi = new TeetalyApi( teetalyConfig.api_key )

        WooProcessWebhookData(
            teetalyApi,
            teetalyConfig,
            Logger,
            wcData,
            WooCommerce,
            res
        )

        return res.status(200).send({
            msg: 'Request Is Correct'
        }).end()
    } else {
        return sendError({
            msg: 'Woo Request Is Wrong',
            code: 403
        }, 403, nodeResponse)
    }
}

module.exports = {
    WooOrderWebhook,
    TeetalySendOrder,
    WooProcessWebhookData
}
