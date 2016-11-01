/**
 * @file: sword-error
 * @author: gejiawen
 * @date: 31/10/2016 15:38
 * @description: sp-error
 *
 * SwordPlus Error
 */

/**
 *
 * @param   {String}      message      Error message for human
 * @param   {String}      type         Error type for machine
 * @param   {String}      systemError  For Node.js system error
 * @return
 */

// type map:
// LACK_OF_PARAMETER
// INVALID_OF_PARAMETER
// 404
// ERROR_OF_MAKEDIR
// SUFFIX_NOT_SUPPORT
// SUFFIX_IS_REQUIRED
// TIMEOUT
// MODULE_NOT_FOUND
// NO_TEMPLATE_FILE
function SwordError(type, message, systemError) {
    Error.captureStackTrace(this, this.constructor)

    this.name = this.constructor.name
    this.type = type
    this.message = message

    if (systemError) {
        this.code = this.errno = systemError.code
    }
}

require('util').inherits(SwordError, Error)

module.exports = SwordError
