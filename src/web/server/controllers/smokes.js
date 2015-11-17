var express = require('express'),
    Promise = require('promise'),
    smokes = require('../model/smokes'),
    router = express.Router(),
    uuid = require('node-uuid');

function padLeft(totalLength, padChar, str){
    var realStr = str + "";
    return Array(totalLength + 1 - realStr.length).join(padChar) + realStr;
}

function pausecomp(millis)
 {
  var date = new Date();
  var curDate = null;
  do { curDate = new Date(); }
  while(curDate-date < millis);
}

router.get('/test', function(req, res) {
    res.send('hello world');
});

router.post('/event', function(req, res) {
    pausecomp(100);
    console.log(req.body);
    
    var returnBody = "smokes_update:" + 
        "grill:" + padLeft(5, " ", 95) + 
        "meat:" + padLeft(5, " ", 185) +
        "END";
    var deviceId = uuid.unparse(new Buffer(req.body.id));
    
    var tokens = [
        deviceId,
        new Date().getTime() / 1000, // seconds since epoch...
        isNaN(req.body.temp1) ? null : req.body.temp1,
        isNaN(req.body.temp2) ? null : req.body.temp2,
        0,
        0,
        req.body.fanstate
    ];
    
    smokes.addEvent(tokens)
        .then(function(){
            res.send(returnBody);
        }, function(){
            res.send('ERROR');
        });
});

module.exports = router