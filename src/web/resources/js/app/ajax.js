var Promise = require('promise');
var $ = require('jquery');

function jqueryAjaxPromise(options) {
    var _internalPromise = new Promise(function(resolve,reject) {
        options.success = resolve;
        options.error = reject;
    });
    
    return $.extend($.ajax(options), {
        promise: function() {
            return _internalPromise
                .then(Promise.resolve, Promise.reject);
        }
    });
}

var ajax = {
    get: function(url, data, overrides){
        var options = {
            url: url,
            data: data, 
            type: 'GET',
            dataType: 'json'
        }
        options = $.extend(options, overrides);
        return jqueryAjaxPromise(options);
    },
    post:  function(url, data, overrides){
        var options = {
            url: url,
            data: data,
            type: 'POST',
            dataType: 'json'
        }
        options = $.extend(options, overrides);
        return jqueryAjaxPromise(options);
    }
}

module.exports = ajax;