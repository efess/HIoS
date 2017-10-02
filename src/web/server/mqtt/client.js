var mqtt = require('mqtt');
var eventModules = [
    require('./device/smokes').events,
    require('./device/environment').events,
];
var events = eventModules.reduce((arr, evnts) => { return arr.concat(evnts);}, []);

// var mqttHost = 'mqtt://mqtt.home.lan:1880';

const connect = (config) => {
    var url = `mqtt://${config.host}:${config.port}`
    console.log('mqtt attempting to connect to ' + url);
    var client = mqtt.connect(url);
    client.on('error', function(err) {
        console.log('mqtt can\'t connect: ' + err);
    })
    client.on('connect', function(){
        console.log('mqtt connected');
        events.forEach(event => {
            client.subscribe(event.topic);
        }); 
    });
     
    client.on('message', function(topic, data){
        var evnt = events.find(event => {
            return event.topicRegex ? 
                event.topicRegex.test(topic) :
                event.topic === topic;
        });
        if(evnt) {
            evnt.onEvent(data, topic);
        }
    });
}

module.exports = {
    connect
}