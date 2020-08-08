class Logger {

    constructor() {}

    log(...args) {
        const timestamp = new Date().toISOString();
        console.log(`${timestamp} - `, ...args)
    }

    dir(obj) {
        obj._____log_timestamp = new Date().toISOString();
        console.dir(obj, { depth: null })
    }

}

class Singleton {

  constructor() {
      if (!Singleton.instance) {
          Singleton.instance = new Logger();
      }
  }

  getInstance() {
      return Singleton.instance;
  }

}

module.exports = Singleton;