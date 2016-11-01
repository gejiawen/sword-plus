/**
 * @file: 404
 * @author: gejiawen
 * @date: 01/11/2016 14:26
 * @description: 404
 */
module.exports = {
    init: function *() {
        return this.pugger.render('404')
    }
}
