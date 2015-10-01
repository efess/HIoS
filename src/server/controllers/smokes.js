var express = require('express'),
    Promise = require('promise'),
    smokes = require('../model/smokes'),
    router = express.Router();
    
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
    
    var tokens = [
        req.body.id,
        new Date(Date.UTC()),
        req.body.temp1,
        req.body.temp2,
        0,
        0,
        req.body.fanstate
    ];
    
    smokes.addEvent(tokens)
        .then(function(){
            res.send('OK');
        }, function(){
            res.send('ERROR');
        });
});

module.exports = router