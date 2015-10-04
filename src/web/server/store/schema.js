var db = require('../db');
var R = require('ramda');
var Promise = require('promise');
// To modify database
// - increment below database_version variable
// - append sql statements to script at the end of this class using new version

// db changelog:
// 0 - initial prototype
    
var latestVersion = 1
var sqlList = [];

function addSql(sql, version){
    sqlList.push({
        sql: sql,
        version: version
    });
}


function createUpgradeTable() {
     return db.query("CREATE TABLE IF NOT EXISTS upgrade_history (" +
              "id INTEGER PRIMARY KEY AUTO_INCREMENT NOT NULL," +
              "upgrade_date DATETIME," +
              "version INTEGER" +
            ");");
}

function getCurrentVersion(){
    return db.query("SELECT IFNULL(MAX(version),0) AS currentVersion FROM upgrade_history")
        .then(R.compose(R.prop('currentVersion'),R.head));
}

function setLatestVersion(){
    return db.query("INSERT INTO upgrade_history (version, upgrade_date) VALUES (?, ?)", [latestVersion, new Date()])
}

function getUpgradeSqls(currentVersion){
    var upgradeSqls = [];
    return [];
    // Version 0 - initial prototype
    if(currentVersion <= 0){
        upgradeSqls.push('CREATE TABLE IF NOT EXISTS devices(' +
            'tableId INTEGER AUTO_INCREMENT PRIMARY KEY,' + 
            'id VARCHAR(50) NOT NULL UNIQUE,' +
            'type VARCHAR(50),'+
            'firstSeen DATETIME,' +
            'lastConnect DATETIME' +
            ');');
            
        upgradeSqls.push('CREATE TABLE IF NOT EXISTS smokes(' +
            'tableId INTEGER AUTO_INCREMENT PRIMARY KEY,' + 
            'deviceId VARCHAR(50) NOT NULL UNIQUE,' +
            'temp1Desc VARCHAR(50),' +
            'temp2Desc VARCHAR(50),' +
            'temp3Desc VARCHAR(50),' +
            'temp4Desc VARCHAR(50)' +
            ');');
            
        upgradeSqls.push('CREATE TABLE IF NOT EXISTS smokes_events (' +
            'tableId INTEGER AUTO_INCREMENT PRIMARY KEY,' + 
            'deviceId VARCHAR(50),' +
            'timestamp INTEGER,' +
            'temp1 FLOAT,' +
            'temp2 FLOAT,' +
            'temp3 FLOAT,' +
            'temp4 FLOAT,' +
            'fanstate VARCHAR(20)' +
            ');');
            
        upgradeSqls.push('CREATE INDEX idx_smokes_events_deviceid_timestamp ON smokes_events(' +
            'deviceId ASC,' +
            'timestamp ASC' +
            ');');
            
        upgradeSqls.push('CREATE INDEX idx_smokes_events_deviceid ON smokes_events(' +
            'deviceId ASC' +
            ');');
            
        upgradeSqls.push('CREATE INDEX idx_smokes_events_timestamp ON smokes_events(' +
            'timestamp  ASC' +
            ');');
    }
    
    return upgradeSqls;   
}

function performUpgrade(upgradeSqls) {
    if(upgradeSqls.length){
        return db.execTransaction(R.map(function(sql){
                return db.createStoredQuery(sql, []);
            }, upgradeSqls));
    } else {
        return Promise.resolve();
    }
}

function upgrade(){
    return createUpgradeTable()
        .then(getCurrentVersion)
        .then(R.compose(performUpgrade, getUpgradeSqls));
    // get history;
}

var schema = {
    upgrade: upgrade
}

module.exports = schema;