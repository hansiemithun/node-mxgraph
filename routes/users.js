var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  // res.send('respond with a resource');
  res.render('users', { title: 'Users' });
});

router.get('/:id', function(req, res, next) {
  // res.send('respond with a resource');
  res.render('users', { title: 'UserId' });
});

module.exports = router;
