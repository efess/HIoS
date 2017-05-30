var db = require('../db');
var R = require('ramda');
var Promise = require('promise');
// To modify database
// - increment below database_version variable
// - append sql statements to script at the end of this class using new version

// db changelog:
// 0 - initial prototype
// 2 - Changed smoker tables structure to work with multiple probes
// 3 - Increase timestamp columns to BIGINT
// 4 - Added environment table
// 5 - Added weather tables
// 6 - Added astronomy weather table

var latestVersion = 6;
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
    console.log("upgraded db to version " + latestVersion);
    return db.query("INSERT INTO upgrade_history (version, upgrade_date) VALUES (?, ?)", [latestVersion, new Date()])
}

function getUpgradeSqls(currentVersion){
    var upgradeSqls = [];
    console.log("current db version " + currentVersion);
    // Version 0 - initial prototype
    if(currentVersion <= 0){
        upgradeSqls.push('CREATE TABLE IF NOT EXISTS device (' +
            'tableId INTEGER AUTO_INCREMENT PRIMARY KEY,' + 
            'id VARCHAR(50) NOT NULL UNIQUE,' +
            'type VARCHAR(50),'+
            'firstSeen DATETIME,' +
            'lastConnect DATETIME' +
            ');');
            
        upgradeSqls.push('CREATE TABLE IF NOT EXISTS smokes (' +
            'tableId INTEGER AUTO_INCREMENT PRIMARY KEY,' + 
            'deviceId VARCHAR(50) NOT NULL UNIQUE,' +
            'grillTarget float,' +
            'meatTarget float' +
            ');');
            
        upgradeSqls.push('CREATE TABLE IF NOT EXISTS smokes_session (' +
            'tableId INTEGER AUTO_INCREMENT PRIMARY KEY,' + 
            'deviceId VARCHAR(50),' +
            'start INTEGER,' +
            'end INTEGER,' +
            'meat VARCHAR(20),' +
            'smokerType VARCHAR(20),' +
            'description TEXT' +
            ');');
            
        upgradeSqls.push('CREATE TABLE IF NOT EXISTS smokes_events (' +
            'tableId INTEGER AUTO_INCREMENT PRIMARY KEY,' + 
            'deviceId VARCHAR(50),' +
            'timestamp INTEGER,' +
            'grillTemp FLOAT,' +
            'meatTemp FLOAT,' +
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
            'timestamp ASC' +
            ');');
    }

    if(currentVersion <= 1) {
        // make this stuff actually make sense..
        upgradeSqls.push('ALTER TABLE smokes_events CHANGE meatTemp probe0 FLOAT;');

        upgradeSqls.push('ALTER TABLE smokes_events ADD probe1 FLOAT;');
        upgradeSqls.push('ALTER TABLE smokes_events ADD probe2 FLOAT;');
        upgradeSqls.push('ALTER TABLE smokes_events ADD probe3 FLOAT;');

        upgradeSqls.push('ALTER TABLE smokes_events ADD probe0Target INTEGER;');

        upgradeSqls.push('ALTER TABLE smokes_session ADD probeId INTEGER;');
        upgradeSqls.push('ALTER TABLE smokes_session ADD target INTEGER;');
        upgradeSqls.push('ALTER TABLE smokes_session CHANGE meat name varchar(20);');

        upgradeSqls.push('ALTER TABLE smokes CHANGE meatTarget fanPulse INTEGER;');
    }

    if(currentVersion <= 2) {
        // integer isn't large enough for time..'
        upgradeSqls.push('ALTER TABLE smokes_events MODIFY timestamp BIGINT;');
        upgradeSqls.push('ALTER TABLE smokes_session MODIFY start BIGINT;');
        upgradeSqls.push('ALTER TABLE smokes_session MODIFY end BIGINT;');
    }

    if(currentVersion <= 3) {
        upgradeSqls.push('CREATE TABLE IF NOT EXISTS env_events (' +
            'tableId INTEGER AUTO_INCREMENT PRIMARY KEY,' + 
            'deviceId VARCHAR(50),' +
            'timestamp INTEGER,' +
            'temperature FLOAT,' +
            'humidity FLOAT,' +
            'pressure FLOAT,' +
            'motion INTEGER' +
            ');');
    }

    if(currentVersion <= 4) {
        upgradeSqls.push('CREATE TABLE IF NOT EXISTS weather_location (' +
            'tableId INTEGER AUTO_INCREMENT PRIMARY KEY,' + 
            'api_url VARCHAR(50),' +
            'city VARCHAR(50),' +
            'state VARCHAR(50)' +
            ');');

        upgradeSqls.push('CREATE TABLE IF NOT EXISTS weather_now (' +
            'tableId INTEGER AUTO_INCREMENT PRIMARY KEY,' + 
            'locationId VARCHAR(50),' +
            'timestamp INTEGER,' +
            'json TEXT' +
            ');');

        upgradeSqls.push('CREATE TABLE IF NOT EXISTS weather_forecast (' +
            'tableId INTEGER AUTO_INCREMENT PRIMARY KEY,' + 
            'locationId VARCHAR(50),' +
            'timestamp INTEGER,' +
            'startDate INTEGER,' +
            'days INTEGER,' +
            'json TEXT' +
            ');');

        upgradeSqls.push('CREATE TABLE IF NOT EXISTS weather_hourly (' +
            'tableId INTEGER AUTO_INCREMENT PRIMARY KEY,' + 
            'locationId VARCHAR(50),' +
            'timestamp INTEGER,' +
            'date INTEGER,' +
            'json TEXT' +
            ');');
    }
    
    if(currentVersion <= 5){
        upgradeSqls.push('CREATE TABLE IF NOT EXISTS weather_astronomy (' +
            'tableId INTEGER AUTO_INCREMENT PRIMARY KEY,' + 
            'locationId VARCHAR(50),' +
            'timestamp INTEGER,' +
            'json TEXT' +
            ');');
    }

    return upgradeSqls;   
}

function performUpgrade(upgradeSqls) {
    if(upgradeSqls.length){
        return db.execTransaction(R.map(function(sql){
                return db.createStoredQuery(sql, []);
            }, upgradeSqls))
            .then(setLatestVersion);
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