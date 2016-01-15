var express = require('express'),
    Promise = require('promise'),
    edison = require('../model/edison'),
    mqtt = require('mqtt'),
    router = express.Router(),
    uuid = require('node-uuid');

setTimeout(function() {
    var client = mqtt.connect('mqtt://localhost:1880');

    client.on('connect', function(){
        console.log('mqtt connected');
        client.subscribe('accel');
    });
    
    client.on('message', function(topic, accel){
        edison.addEvent({text: accel.toString()});
    });
    
    
    
}, 5000);

router.get('/', function(req, res) {
    res.render('edison', { 
        title: 'Home HIoS - Edison Test'});
});

router.get('/getEvents', function(req, res) {
    var string = '';
    var events = edison.getAllEvents();
    
    for(var i = 0; i < events.length; i++) {
        string += events[i].text + "<br>";
    }
    return res.json(string);
});
    

module.exports = router