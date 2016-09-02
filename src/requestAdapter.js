var Promise = require('promise');
var Request = require('poorequest');
var url = require('url');
var debug = require('debug')('request')

var RequestAdapter = function() {
    var requestbot = new Request();
    var postPromise = function(dstUrl, option) {
        return new Promise(function(resolve, reject) {
            requestbot.post(dstUrl, option,
            function(err, res) {
                if (err) {
                    reject(err);
                } else {
                    try {
                        res.data = res.body.toString();
                        res.data = res.body.toJson();
                    } catch(e) {}
                    resolve(res);
                }
            })

        });
    }
    var getPromise = function(dstUrl, option) {
        return new Promise(function(resolve, reject) {
            requestbot.get(dstUrl, option,
            function(err, res) {
                if (err) {
                    reject(err);
                } else {
                    try {
                        res.data = res.body.toString();
                        res.data = res.body.toJson();
                    } catch(e) {}
                    resolve(res);
                }
            })

        });
    }
    var multiPromise = function(dstUrl, option) {
        return new Promise(function(resolve, reject) {
            requestbot.multi(dstUrl, option,
            function(err, res) {
                if (err) {
                    reject(err);
                } else {
                    try {
                        res.data = res.body.toString();
                        res.data = res.body.toJson();
                    } catch(e) {}
                    resolve(res);
                }
            })

        });
    }
    this.R = function(option) {
        var reqUrl = option.url;
        if ('production' == process.env.NODE_ENV) {
            var urlParsed = url.parse(reqUrl);
            urlParsed.host = '127.0.0.1' + ':' + process.env.PORT;
            urlParsed.protocol = process.env.PROTOCOL;
            urlParsed.port = process.env.PORT;
            reqUrl = url.format(urlParsed);
            //console.log(urlParsed)
        }
        debug(">>", reqUrl);
        if (option.method === 'POST') {
            return postPromise(reqUrl, {
                form: option.data,
                type: option.type,
                params: option.params,
                headers: option.headers
            });
        } else if (option.method === 'GET') {
            return getPromise(reqUrl, {
                params: option.params,
                headers: option.headers
            });
        } else if (option.method === 'MULTI') {
            return multiPromise(reqUrl, {
                params: option.params,
                fields: option.data,
                headers: option.headers
            });
        } else {
            console.log('ERR!!!');
        }

    }
}

module.exports = RequestAdapter
