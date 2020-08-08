// APP URL: app-webhooks.zvkrxaqod1-ez94drdle6mr.p.runcloud.link

const express = require('express')
const app = express()
const port = 8888

const _Logger = require('./logger')
const Logger = new _Logger().getInstance()

const WooApi = require('./wooapi')
const WooCommerce = new WooApi().getInstance()

// const TeetalyApi = require('./teetalyapi')

const bodyParser = require('body-parser')

const { WooOrderWebhook } = require('./webhooks/wooorder')

// custom middleware - req, res, next must be arguments on the top level function
function myMiddleware(req, res, next) {
    req.rawBody = '';

    req.on('data', function(chunk) {
        req.rawBody += chunk;
    });

    // call next() outside of 'end' after setting 'data' handler
    next();
}

// your middleware
app.use(myMiddleware);

// bodyparser
app.use(bodyParser.json())

// test that it worked
function afterMiddleware(req, res, next) {
    Logger.log({
        msg: 'req.rawBody: ',
        rawBody: req.rawBody
    });
    
    next();
}

app.use(afterMiddleware);

app.use(bodyParser.urlencoded({
    extended: true
}))

app.get('/', (req, res) => res.send('Hello World From NodeJS!'))

Logger.log('WooOrderWebhook: ', WooOrderWebhook)

//app.get ('/order_webhook', (req, res) => WooOrderWebhook(req, res, Logger, WooCommerce))
app.post('/order_webhook', (req, res) => WooOrderWebhook(req, res, Logger, WooCommerce))

app.get('/products', (req, res) => {
    WooCommerce.getAsync('products').then(resp => {
        res.json(JSON.parse(resp.toJSON().body));
    });
})

app.get('/test_order', (req, res) => {
    WooCommerce.getAsync('orders/4840')
    .then(resp => {
        res.json(JSON.parse(resp.toJSON().body));
    })
    .catch(err => {
        Logger.log({
            msg: 'Error test_order',
            data: err
        })
    })
})

app.listen(port, () => {
    const WooConfig = WooCommerce.getConfig()

    Logger.log({msg: `WebHooks Server Listening at http://localhost:${port}`})
    Logger.log({msg: `ENV: `, data: process.env.NODE_ENV})
    Logger.log({msg: `WooCommerce Config: `, data: WooConfig})
})