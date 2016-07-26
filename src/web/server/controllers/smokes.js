var express = require('express'),
    Promise = require('promise'),
    smokes = require('../model/smokes'),
    router = express.Router(),
    uuid = require('node-uuid');
    
router.get('/', function(req, res) {
    res.render('smoker', { 
        title: 'Home HIoS - Smoker Stoker'});
});

router.post('/changeTargets', function(req,res) {
    var meatTarget = parseInt(req.body.meatTarget) || 0;
    if(meatTarget < 50 || meatTarget > 1000) {
        meatTarget = 0;
    }
    var grillTarget = parseInt(req.body.grillTarget) || 0;
    if(grillTarget < 50 || grillTarget > 1000) {
        grillTarget = 0;
    }
    var tokens = [
        grillTarget,
        meatTarget,
        req.body.deviceId
    ];
    
    smokes.setTargets(tokens)
        .then(function _success(){
            res.send("SUCCESS");
        }, function _fail(err) {
            res.send('Error: ' + err);
        });
});

router.post('/updateSession', function(req, res) {
    var tokens = [
        req.body.end ? new Date() : 0,
        req.body.meat || '',
        "Char-Griller AKORN", //req.body.smokerType || '',
        req.body.description || '',
        req.body.deviceId
    ];
    
    smokes.saveSession(tokens)
        .then(function _success(){
            res.send("SUCCESS");
        }, function _fail(err) {
            res.send('Error: ' + err);
        });
});

router.post('/newSession', function(req, res) {
    var tokens = [
        req.body.deviceId,
        new Date(),
        0,
        req.body.meat || '',
        "Char-Griller AKORN", //req.body.smokerType || '',
        req.body.description || ''
    ];
    
    smokes.createSession(tokens)
        .then(function _success(){
            res.send("SUCCESS");
        }, function _fail(err) {
            res.send('Error: ' + err);
        });
});

router.get('/status2', function(req, res){

    var fakeData = {
        temps: [
            {   id: 1,
                name: "grill",
                current: 211,
                target: 230,
                graph: [
                    { time: 123456789, temp: 110 },
                    { time: 123456790, temp: 110 },
                    { time: 123456791, temp: 110 },
                    { time: 123456792, temp: 100 },
                    { time: 123456793, temp: 105 },
                ]
            },
            {
                id: 2,
                name: 'Steak',
                current: 190,
                target: 195
            }
        ] 
    };
    
    res.json(fakeData);
});

router.get('/status', function(req, res) {
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
    var response = {
        history: [],
        current: {},
        targets: {},
        session: {}
    };
    
    Promise.all([
        smokes.getEvents(tokens).then(function(data){ response.history = data; }),
        smokes.getEvent(deviceId).then(function(data){ response.current = data; }),
        smokes.getTargets(deviceId).then(function(data){ response.targets = data; }),
        smokes.getExistingSession(deviceId).then(function(data){ response.session = data; })
    ]).then(function _success(){
        res.send(JSON.stringify(response));
    }, function _fail(err) {
        res.send('Error: ' + err);
    });
    
});

module.exports = router