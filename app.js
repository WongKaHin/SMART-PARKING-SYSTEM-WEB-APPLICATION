var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { MongoClient } = require('mongodb');
const client = new MongoClient("mongodb://localhost:27017/");
const passport = require('passport');
const session = require('express-session');
require('./routes/passport');
require('./jobs/scheduleEmail');
require('./services/carparkService');


var nearestCarparkRouter = require('./routes/nearestCarpark')
var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');
var registerRouter = require('./routes/register');
var editRouter = require('./routes/edit');
var carparkRouter = require('./routes/carpark');
var reserveRouter = require('./routes/reserve');
var favoriteRouter = require('./routes/favorite');
var authRouter = require('./routes/auth');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'your-session-secret',
  resave: false,
  saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



app.use('/', indexRouter);
app.use('/carpark', carparkRouter);
app.use('/login', authRouter);
app.use('/register', registerRouter);
app.use((req, res, next)=> {
  if(!req.session.isLoggedIn) res.redirect('/login');
  else next();
})
app.use('/favorite', favoriteRouter);
app.use('/admin', adminRouter);
app.use('/edit', editRouter);
app.use('/reserve', reserveRouter)
app.use('/near',nearestCarparkRouter)


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', { error: err, data:"", isLoggedIn:false});
});



process.on('SIGINT', async () => {
  await client.close();
  console.log('Disconnected from MongoDB');
  process.exit(0);
});

module.exports = app;
