
module.exports = {
    init: function *() {
        // var rst = yield this.connector.get('/user')
        // var rst = yield this.connector.get('/mallext/batch_fetch_goods.rpc', {
        //     type: 2,
        //     num: 4
        // })

        return this.pugger.render('index')
    }
}
