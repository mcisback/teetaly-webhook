// NodeJS TeetalyApi Integration
const axios = require('axios');

const _Logger = require('./logger');
const MyLogger = new _Logger().getInstance();

const TEETALY_API_AUTH_HEADER = 'Authorization: Bearer '
const TEETALY_API_BASE_ENDPOINT = 'https://teetaly-shiketsu.azurewebsites.net/api/'
const TE_DEBUG = true

class TeetalyApi {
    constructor(api_key) {
        this.api_key = api_key
        this.errmsg = ''
    }

    getApiKey() {
        return this.api_key
    }

    makeEndpointUrl( endpoint ) {
        return TEETALY_API_BASE_ENDPOINT + endpoint;
    }

    getAuthHeader() {
        return TEETALY_API_AUTH_HEADER + this.api_key;
    }

    hasError() {
        return this.errmsg !== '';
    }

    getErrorMsg() {
        return this.errmsg;
    }

    exec( endpoint, method = 'GET', postData={} ) {

        if( TE_DEBUG === true ){
        
            MyLogger.log({
                msg: "TeetalyApi::exec Called",
                endpoint: this.makeEndpointUrl( endpoint ),
                method: method,
                postData:  postData
            })
        
        }

        let headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.api_key
        }

        return axios({
            method: method,
            url: this.makeEndpointUrl( endpoint ),
            data: postData,
            headers: headers
        })
    }

    execGet( endpoint ) {
        return this.exec( endpoint, 'GET' );
    }

    execPost( endpoint, postData ) {
        return this.exec( endpoint, 'POST', postData );
    } 

    getProductDetails() {
        return this.execGet( 'product/detail' );
    }

    insertGraphics( postData ) {
        return this.execPost( 'orderitem/graphics', postData );
    }

    /**
     * {
     *  "OrderId": 4074,
     *  "OrderItemids": {
     *   "1955-nov-05": 6938
     *  }
     * }
     */

    /**
     * Create Order, but do not confirm it, gets a json with OrderId Back
     */
    createOrder( postData ) {
        return this.execPost( 'order', postData );
    }

    /**
     * Confirm an order, requires to call createOrder before
     * and pass orderId.
     */
    setOrderPrintable( orderId ) {
        return this.execGet( 'order/setprintable/' + orderId );
    }

    /* createAndConfirmOrder( postData ) {
        this.createOrder( postData )
        .then((res) => {
            return {
                orderId: res.OrderId,
                orderConfirm: this.setOrderPrintable( res.OrderId )
            };
        })
    } */

    // Get Province
    getState() {
        return this.execGet( 'state' );
    }

    getCountry() {
        return this.execGet( 'country' );
    }

    getStateByCountryId( country_id ) {
        return this.execGet( 'country/' + country_id + '/state' );
    }

    getCountryByTwoLetterIsoCode( isocode ) {
        return this.execGet( 'country/twoletterisocode/' + isocode );
    }

    getCountryById( country_id ) {
        return this.execGet( 'api/country/' + country_id );
    }

    getProductDetailsBySku( sku ) {
        return this.execGet( 'product/detail/sku/' + sku );
    }

    getProductDetailsById( id ) {
        return this.execGet( 'product/detail/' + id );
    }
}

/* class Singleton {

  constructor() {
      if (!Singleton.instance) {
          Singleton.instance = new TeetalyApi();
      }
  }

  getInstance() {
      return Singleton.instance;
  }

} */

module.exports = TeetalyApi;
