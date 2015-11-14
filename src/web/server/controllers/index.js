var express = require('express'),
    smokes = require('../model/smokes')
  , router = express.Router();
  
/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { title: 'rendered with jade' });
});

router.get('/eventstest', function(req, res) {
    var deviceId = req.query.deviceId;
    var fromTime = 0;
    var toTime = 9443881643;
    
    
    var tokens = [
        deviceId,
        fromTime, // seconds since epoch...
        toTime,
        req.query.gran || 3600,
        req.query.limit || 100,
    ];
    
    smokes.getEvents(tokens)
        .then(function(data){
            res.send(JSON.stringify(data));
        }, function(){
            res.send('ERROR');
        });
});

router.use('/device/smokes', require('./smokes'));
router.use('/admin', require('./admin'));

module.exports = router