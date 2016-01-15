var express = require('express'),
    Promise = require('promise'),
    router = express.Router(),
    uuid = require('node-uuid'),
    mqtt = require('mqtt');
 
var topics = {
    stateResponse: '/home/kitchen/cabinet/lights/response',
    stateRequest: '/home/kitchen/cabinet/lights/request'
}
router.get('/', function(req, res) {
    res.render('undercabinet', { 
        title: 'Home HIoS - Under cabinet lights'});
});

router.post('/getState', function(req, res) {
    
    var client = mqtt.createClient(1880, 'localhost');
    client.on('connect', function(){
        console.log('mqtt connected');
        client.subscribe(topics.stateResponse);
        client.publish(topics.stateRequest);
    });
    
    client.on('message', function(topic, data){
       if(topic === topics.stateResponse) {
           //opt,16762193,133433,pal,16711680,16777215,65280,16777215,16711680,16777215,65280,16777215,16711680,16777215,65280,16777215,16711680,16777215,65280,16777215
           var response = {
               options: {
               },
               pallete: []
           }
           var parts = data.toString().split(',');
           if(parts[0] === 'opt' && parts.length > 2) {
               var color = parts[1];
               var options = parseInt(parts[2]);
               var occupied = {};
               var unoccupied = {};
               
               options >>= 1;
               occupied.brightness = options & 0xF;
               options >>= 4;
               occupied.animation = options & 0x7;
               options >>= 3;
               occupied.transition = options & 0x3;
               options >>= 2;
               unoccupied.brightness = options & 0xF;
               options >>= 4;
               unoccupied.animation = options & 0x7;
               options >>= 3;
               unoccupied.transition = options & 0x3;
               
               response.color = parseInt(color);
               response.options.unoccupied = unoccupied;
               response.options.occupied = occupied;
           }
           if(parts[3] === 'pal') {
               for(var i = 4; i < parts.length; i++) {
                   response.pallete.push(parseInt(parts[i]));
               }
           }
           res.send(response);
            client.end();
           
       }
    });
    
});

router.post('/changeOptions', function(req,res) {
    
    var color = req.body.color;
    var options = req.body.options || {};
    var occupiedOpts = options.occupied;
    var unoccupiedOpts = options.unoccupied;
    var pallete = req.body.pallete;
    
    if(!occupiedOpts || !occupiedOpts || !color) {
        res.send("ERROR NO DATA");
        return;
    }
    var colorNum = (color.red << 16) | (color.green << 8) | color.blue
    
    var opt = parseInt(unoccupiedOpts.transition);
    
    opt <<= 3;
    opt = opt | parseInt(unoccupiedOpts.animation); //anim

    opt <<= 4;
    opt = opt | parseInt(unoccupiedOpts.brightness); //bright

    opt <<= 2;
    opt = opt | parseInt(occupiedOpts.transition); //tran

    opt <<= 3;
    opt = opt | parseInt(occupiedOpts.animation); //anim

    opt <<= 4;
    opt = opt | parseInt(occupiedOpts.brightness); //bright

    opt <<= 1;
    opt = opt | 1; //occ
    
    if(pallete && pallete.length > 0) {
        
    }
    var client = mqtt.createClient(1880, 'localhost');
    
    if(pallete && pallete.length > 0) {
        var palleteStr = 'pal';
        for(var i = 0; i < pallete.length; i ++) {
            palleteStr = palleteStr + ',' + pallete[i];
        }
        client.publish('/home/kitchen/cabinet/lights/update', palleteStr);
    }
    
    client.publish('/home/kitchen/cabinet/lights/update', 'opt,' + colorNum + ',' + opt);
    
    client.end();
    
    res.send("SUCCESS");
});
module.exports = router