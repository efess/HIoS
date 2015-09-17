var express = require('express'),
    Promise = require('promise'),
    router = express.Router();
    
router.get('/test', function(req, res) {
    res.send('hello world');
});

module.exports = router