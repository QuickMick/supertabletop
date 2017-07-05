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

//var sessionService = require('./sessionservice');

var LanguageMiddleware = require('./routes/languagemiddleware');

// const MongoStore = require('connect-mongo')(expressSession);

var Redis = require("redis");
const RedisStore = require('connect-redis')(expressSession);
const DBs = require('./server/distributed/db.json');

//const COOKIE_MAX_AGE = 1000*60*60*24; // 1 day
const COOKIE_MAX_AGE = 1000*60*5; // 5 min

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
var allowedCORSOrigins = "http://127.0.0.1:9000";

/*
 const MongoStore = require('connect-mongo')(expressSession);
//TODO replace mongoose durch redis
const mongoose = require('mongoose');
 mongoose.connect(require('./server/distributed/db.json').userDB.old);

 var sessionStore = new MongoStore({
 mongooseConnection: mongoose.connection,
 autoRemove: 'native',
 touchAfter: 60 // time period in seconds
 });
*/

var sessionStoreClient = Redis.createClient({
    port: DBs.sessionStore_redis.port,
    host: DBs.sessionStore_redis.host,
    password: DBs.sessionStore_redis.password,
    db: DBs.sessionStore_redis.database
});
var sessionStore = new RedisStore({
    ttl: COOKIE_MAX_AGE/1000,
    client: sessionStoreClient,
    prefix:DBs.sessionStore_redis.prefix.session
});

var sessionInstance = expressSession(
    {
        key: sessionsKey,
        saveUninitialized: false, // don't create session until something stored
        resave: false, //don't save session if unmodified
      /*  resave: true,
        saveUninitialized: true,*/
        store: sessionStore, // new RedisStore({}),
        secret: sessionsSecret,
        unset: "destroy"
        ,cookie:{maxAge:COOKIE_MAX_AGE}  // expires in 5 minutes
    }
);


// Enable CORS
var allowCrossDomain = function (req, res, next) {
    res.header("Access-Control-Allow-Origin", allowedCORSOrigins);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
};

app.use(allowCrossDomain);

app.use(sessionInstance);

app.use(passport.initialize());
app.use(passport.session());

var passportSocketIo = function(app,sessionInstance, passport){
/*
   return function (req, next) {
        var parseCookie = cookieParser(sessionsSecret);
        req = req.request;
        parseCookie(req, null, function (err, data) {
            sessionService.get(req, function (err, session) {
                if (err)
                    return next(new Error(err.message),false);
                if (!session)
                    return next(new Error("Not authorized"),false);
console.log("sockeio_request",session);
                req.session = session;
                if(session) {
                    req.updateSessionValue = function (propertyName, propertyValue, callback) {
                      //  console.log("beforesave:",session);
                         sessionService.getSessionBySessionID(session.id, (err, session)=>{
                            session[propertyName] = propertyValue;
                            session.touch().save();
                             req.session = session;
                        });
                     //   sessionService.setSessionProperty(session, propertyName, propertyValue, callback);
                      //  console.log("aftersave:",session);
                    };
                }
                if (req.session.passport && req.session.passport.user) {
                    passport.deserializeUser(req.session.passport.user, req, function (err, user) {
                        req.user = user;
                        req.user.logged_in = true;
                        next(null, true);
                    });
                } else {
                    next(null,true);
                }
            });
        });
    };*/


    return function(socket, next){

        var req = socket.request;//socket.handshake;

        sessionInstance(req, {}/*req.res*/,
            function () {

                if (!req.session) {
                    return next(new Error("no_session_found"), false);
                }

                // req.updateSessionValueDirectly = function (propertyName, propertyValue, callback) {
                //     if(!req.session){
                //         console.log("unauthorized session modification");
                //         return;
                //     }
                //
                //     req.session[propertyName] = propertyValue;
                //     if(callback)
                //         callback(propertyName, propertyValue,req.session);
                //
                //    // req.session.reload(()=>{
                //    //      req.session[propertyName] = propertyValue;
                //    //      req.session.save();
                //    //      if(callback)
                //    //          callback(propertyName, propertyValue,req.session);
                //    //  });
                // };
                //
                // req.updateSessionValueDeferred = function (propertyName, propertyValue, callback) {
                //     if(!req.session){
                //         console.log("unauthorized session modification");
                //         return;
                //     }
                //     req.session.reload(()=>{
                //         req.session[propertyName] = propertyValue;
                //         req._hasChanges = true;
                //         if(callback)
                //             callback(propertyName, propertyValue,req.session);
                //     });
                // };

                req.updateSessionValue = function (propertyName, propertyValue, callback) {
                    if(!req.session){
                        console.log("unauthorized session modification");
                        return;
                    }
                    req.session.reload(()=>{
                        req.session[propertyName] = propertyValue;
                        req.session.save();
                        if(callback)
                            callback(propertyName, propertyValue,req.session);
                    });
                };

                req.getNormalizedUser = function () {
                    return req.user || req.session.guestUser;
                };


                if(req.session.passport && req.session.passport.user) {
                    passport.deserializeUser(req.session.passport.user, req, function (err, user) {

                        if(err){
                            console.log("err",err);
                            return next(err,false);
                        }

                        req.user = user;
                        req.user.logged_in = true;
                        return next(null, true);
                    });
                }else {
                    return next(null, true);
                }
            }
        );
    };
};

/*
app.use(function(req, res, next) {
    req.session.touch().save();

    req.updateSessionValue = function (propertyName, propertyValue, callback) {
        sessionService.getSessionBySessionID(req.sessionID, (err, session)=>{

            if(propertyValue == undefined){
                delete session[propertyName];
            }else{
                session[propertyName] = propertyValue;
            }

            session.touch().save();
            req.session = session;

            if(callback){
                callback(err,session);
            }
        });
    };

    req.reloadSession = function (callback) {
        if(!req.sessionID){
            if(callback){
                callback("not_authorized");
            }
            return;
        }
        sessionService.getSessionBySessionID(req.sessionID, (err, session)=>{
            req.session = session;
            if(callback){
                callback(null,session);
            }
        });
    };

    req.reloadSession(()=>next());

   // next();
});

*/

//sessionService.initialize(sessionStoreClient,sessionStore,sessionsKey);
app._SESSION_SOCKET_CONNECTION_MIDDLEWARE = passportSocketIo(app,sessionInstance,passport/*,cookieParser(sessionsSecret),sessionService*/);



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
var userManagementRoute = require('./routes/user_management_route')(passport, userManager,sessionStore);


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


/*
app.use('/already-connected',
    LanguageMiddleware,
    function (data,req, res, next) {
        if(req.session && req.session.opened) { //session opened are set in connectionhandler
            res.render('prohibited', {I18N: data.i18n});
        }else{
            return res.redirect('/');
        }
    }
);*/
/*
/// check if the user already has obened the page in another tab, if yes, redirect him
app.use('/',function(req,res,next){
    console.log("lobby",req.session.isInLobby);
    if(req.session && req.session.opened){
        req.flash('message',"already_connected");
        return res.redirect('/prohibited');
    }
    next();
});
*/

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
console.log(err.messag);
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
