var mqtt = require('mqtt');
var eventModules = [
    require('./device/smokes').events,
    require('./device/environment').events,
];
var events = eventModules.reduce((arr, evnts) => { return arr.concat(evnts);}, []);
var mqttHost = 'mqtt://mqtt.home.lan:1880';

var client = mqtt.connect(mqttHost);

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
