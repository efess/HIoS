var express = require('express'),
    Promise = require('promise'),
    router = express.Router();
    
router.get('/test', function(req, res) {
    res.send('hello world');
});

router.post('/test', function(req, res) {
    console.log(req.body)
    res.send('hello world');
});

module.exports = router