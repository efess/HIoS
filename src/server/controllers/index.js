var express = require('express')
  , router = express.Router();

router.use('/device/smokes', require('./smokes'));

module.exports = router