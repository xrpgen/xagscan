const createError = require('http-errors');
const express     = require('express');
const compress      = require('compression');

var app = express();

app.use(compress());
const options = {
  dotfiles: 'ignore',
  extensions: ['html'],
  index: "index.html"
}
app.use(express.static('.',options));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
// error handler
app.use(function(err, req, res, next) {
  //console.log(req);
  console.error('Error handler',err);
  res.status(err.status || 500).send('出错啦，请重新尝试或联系xrpgen.com =>'+ err.status +":"+ err.message);
});
module.exports = app;
