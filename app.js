var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var helmet = require('helmet');
var uuidv1 = require('uuid/v1');

var Flash = require('connect-flash');

var passport = require('passport');
var expressSession = require('express-session');


var index = require('./routes/index');
var users = require('./routes/users');
var editorRoute = require('./routes/editor_route');
var gameListRoute = require('./routes/gamelist_route');
var userManagementRoute = require('./routes/user_management_route')(passport);

var UserManager = require('./server/distributed/usermanager');



//var lobbyRoute = require('./routes/lobby_route');

//compile all templates in the /view/fragments folder
var LayoutTemplatesCompilter = require('./views/fragments/compilelayouts');
new LayoutTemplatesCompilter().compile();

var Globals = require('./server/globals');
Globals.ROOT= __dirname;

var app = express();

app.use(helmet());

var secret = uuidv1();
app.use(expressSession({secret: secret}));
app.use(passport.initialize());
app.use(passport.session());

var userManager = new UserManager(passport);


// Using the flash middleware provided by connect-flash to store messages in session
// and displaying in templates

app.use(Flash());


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



/* GET Home Page */
/*router.get('/home', isAuthenticated, function(req, res){
  res.render('home', { user: req.user });
});*/

// As with any middleware it is quintessential to call next()
// if the user is authenticated
var isAuthenticatedMiddleware = function (req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/');
};



app.use('/', index);

app.use('/',userManagementRoute);
//app.use('/lobby',lobbyRoute);
app.use('/hacking', users);
app.use('/editor', editorRoute);
app.use('/games',gameListRoute);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
