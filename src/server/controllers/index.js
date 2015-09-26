var express = require('express')
  , router = express.Router();

router.use('/device/smokes', require('./smokes'));
router.use('/admin', require('./admin'));

module.exports = router