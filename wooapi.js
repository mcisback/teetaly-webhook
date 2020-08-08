const WooCommerceAPI = require('woocommerce-api')

class WooApi extends WooCommerceAPI {

    constructor() {
        const WooConfig = {
            url: 'https://figlidiputin.it',
            consumerKey: 'ck_62d1072d7d3d27fb904030f31f0f558b3b04a200',
            consumerSecret: 'cs_a0a259a46c0b9848c0375b45fe025573c68084b7',
            webhookSecretKey: '00d463793784e3b25254dc187db5f20c7ff0b3b825ef32e3fd34d8236c91b78d'
        }
         
        super({
          url: WooConfig.url,
          consumerKey: WooConfig.consumerKey,
          consumerSecret: WooConfig.consumerSecret,
          wpAPI: true,
          version: 'wc/v3',
          queryStringAuth: true
        });

        this._WooConfig = WooConfig
    }

    getConfig() {
        return this._WooConfig
    }
}

class Singleton {

  constructor() {
      if (!Singleton.instance) {
          Singleton.instance = new WooApi();
      }
  }

  getInstance() {
      return Singleton.instance;
  }

}

module.exports = Singleton;