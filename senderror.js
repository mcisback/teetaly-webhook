const _Logger = require('./logger')
const Logger = new _Logger().getInstance()

function sendError(errorObj, httpStatus, nodeResponse) {
    Logger.dir(errorObj)

    return nodeResponse.status(httpStatus).send(errorObj).end()
}

module.exports = {
    sendError
}