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

// const MongoStore = require('connect-mongo')(expressSession);
const RedisStore = require('connect-redis')(expressSession);

const COOKIE_MAX_AGE = 1000*60*5; // 5 min

/**
 * used to make the session and user available in socketIO
 * @param cookieParser
 * @param sessionStore
 * @param passport
 * @param cookie
 * @returns {auth}
 */
/*
var passportSocketIo = function(cookieParser, sessionStore, passport, cookie){
    var _cookie = cookie || 'sessions.sid';
    var _cookieParser = cookieParser;
    var _sessionStore = sessionStore;
    var _passport = passport;

    var auth = function(data, accept){
        if (data && !data.session && data.headers && data.headers.cookie) {
            _cookieParser(data, {}, function(err){
                if(err){
                    return accept('COOKIE_PARSE_ERROR');
                }
                var sessionId = data.signedCookies[_cookie] || data.cookies[_cookie];
                _sessionStore.get(sessionId, function(err, session){

                    data.session = session;

                    if(err || !session || !session.passport || !session.passport.user || !session.passport.user) {
                        return accept(null, true);
                    }

                    if(data.session && data.session.passport && data.session.passport.user) {
                        _passport.deserializeUser(data.session.passport.user, data, function (err, user) {
                            data.user = user;
                            data.user.logged_in = true;
                            accept(null, true);
                        });
                    }else{
                        accept(null, true);
                    }

                });
            });
        } else {
            return accept('MISSING_COOKIE', false);
        }
    };

    return auth;
};*/

var index = require('./routes/index');
var users = require('./routes/users');
var editorRoute = require('./routes/editor_route');
var gameListRoute = require('./routes/gamelist_route');

var UserManager = require('./server/distributed/usermanager');

//var lobbyRoute = require('./routes/lobby_route');

//compile all templates in the /view/fragments folder
var LayoutTemplatesCompilter = require('./views/fragments/compilelayouts');
new LayoutTemplatesCompilter().compile();

var Globals = require('./server/globals');
Globals.ROOT = __dirname;

var app = express();

app.use(helmet());

var sessionsSecret = "ranzenpanzen"; //uuidv1();
var sessionsKey = "sessions.sid";

//TODO replace mongoose durch redis
/*const mongoose = require('mongoose');
mongoose.connect(require('./server/distributed/db.json').userDB.old);

var sessionStore = new MongoStore({
    mongooseConnection: mongoose.connection,
    autoRemove: 'native',
    touchAfter: 60 // time period in seconds
});*/


var sessionStore = new RedisStore({
    unset: "destroy"
});

var sessionInstance = expressSession(
    {
        key: sessionsKey,
        saveUninitialized: false, // don't create session until something stored
        resave: false, //don't save session if unmodified
        store: sessionStore, // new RedisStore({}),
        secret: sessionsSecret
        ,cookie:{maxAge:COOKIE_MAX_AGE}  // expires in 5 minutes
    }
);

app.use(sessionInstance);

app.use(passport.initialize());
app.use(passport.session());






var passportSocketIo = function(app,sessionInstance, passport){

    var auth = function(req, accept){

        sessionInstance(req,req.res,
            function (x) {
                console.log(x);

                if(req.session && req.session.passport && req.session.passport.user) {
                    passport.deserializeUser(req.session.passport.user, req, function (err, user) {
                        req.user = user;
                        req.user.logged_in = true;
                        accept(null, true);
                    });
                }else {
                    return accept(null, true);
                }
            }
        );
    };

    return auth;
};




//app._SESSION_MIDDLEWARE = passportSocketIo(cookieParser(sessionsSecret),sessionStore,passport);


app._SESSION_MIDDLEWARE = passportSocketIo(app,sessionInstance,passport);

/*.authornize({
    cookieParser: cookieParser,
    key: sessionsKey,        // the name of the cookie where express/connect stores its session_id
    secret: sessionsSecret,               // the session_secret to parse the cookie
    store: sessionStore,       // we NEED to use a sessionstore. no memorystore please
    passport: passport,
});*/


var userManager = new UserManager(passport);
app._userManager = userManager;
var guestNameMiddleware = require('./routes/guestnamemiddleware')(userManager);
var userManagementRoute = require('./routes/user_management_route')(passport, userManager);


// Using the flash middleware provided by connect-flash to store messages in session
// and displaying in templates

app.use(Flash());
/*
 app.use(function(req, res, next) {
 // if now() is after `req.session.cookie.expires`
 //   regenerate the session

 if()
 next();
 });

 */
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(cookieParser(sessionsSecret));
app.use(express.static(path.join(__dirname, 'public')));


/* GET Home Page */
/*router.get('/home', isAuthenticated, function(req, res){
 res.render('home', { user: req.user });
 });*/

// As with any middleware it is quintessential to call next()
// if the user is authenticated
var ensureAuthenticatedMiddleware = function (req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/login');
};


app.use('/', guestNameMiddleware);
app.use('/', userManagementRoute);
app.use('/', index);


//app.use('/lobby',lobbyRoute);
app.use('/profile', ensureAuthenticatedMiddleware, users);
app.use('/editor', editorRoute);
app.use('/games', gameListRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
