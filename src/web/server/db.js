var Promise = require('promise');
var R = require('ramda');
var mysql = require('mysql');

var connectionOps = null;

var wrapDbOperation = function(fn){
    var connection = mysql.createConnection(connectionOps);
    
    return new Promise(function(resolve,reject){
        connection.connect(function(err){
            if(err){
                connection.end();
                reject(err);
            } else {
                var end = R.curry(function(fail, result) {
                     connection.end(); 
                     return fail ? reject(result) : resolve(result);
                });
                
                fn(connection)
                    .then(end(false),end(true))
            }
        })  
    })
}

var transaction = function(fns) {
    return wrapDbOperation(function(connection){
        var fnCaller = function(queryFn){
            return queryFn(connection);
        };
        return new Promise(function(resolve,reject){    
            connection.beginTransaction(function(beginErr){
                if(beginErr) {
                    reject(beginErr);
                } else {
                    Promise.all(R.map(fnCaller, fns))
                        .then(function(result){
                            connection.commit(function(commitErr){
                            if(commitErr) {
                                connection.rollback(function(){
                                    reject(commitErr);
                                })
                            } else {
                                resolve(result);
                            }
                            });
                        }, function(fnErr){
                            connection.rollback();
                            reject(fnErr);
                        });
                }
            });
        });
    });
    
};

var storedQueryFn = function(sql, tokens){
    return function(connection) {
        return new Promise(function(resolve,reject) {
            connection.query(sql, tokens, function(err, rows, fields) {
                if(err){
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });            
    }
}

var query = function(sql, tokens) {
    return wrapDbOperation(function(connection){
        return new Promise(function(resolve,reject) {
            connection.query(sql, tokens, function(err, rows, fields) {
                if(err){
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    });
};

function verifyDb(connection){
    return new Promise(function(resolve,reject) {
        connection.query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?", [connectionOps.database], 
            function(err, rows, fields) {
                if(err){
                    reject(err);
                } else {
                    resolve(rows);
                }
        });
    });
}     

function createDb(connection){
    return new Promise(function(resolve,reject) {
        connection.query("CREATE DATABASE " + connectionOps.database, [], 
            function(err, rows, fields) {
                if(err){
                    reject(err);
                } else {
                    resolve(rows);
                }
        });
    });
}     

var db = {
    init: function(storeCfg) {
        connectionOps = storeCfg.params;
        var connection = mysql.createConnection({
            host: connectionOps.host,
            user: connectionOps.user,
            password: connectionOps.password
        }), 
        end = function(){connection.end();};
        
        return verifyDb(connection)
            .then(function(result){
                if(!result.length) {
                    return createDb(connection)
                        .then(end);
                } else {
                    end();
                }
            }, function(err){
                end();
                return Promise.reject(err);
            });
    },
    name: function(){ return connectionOps.database; },
    query: query,
    execTransaction: transaction,
    createStoredQuery: storedQueryFn
};

module.exports = db;