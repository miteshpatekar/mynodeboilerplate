
'use strict';

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
//var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var errorHandler = require('express-error-handler');
//var morgan = require('morgan');
var http = require('http');
var passport = require('passport');
var config = null;

if (process.env.NODE_ENV === "Local") {
    config = require('./config/LocalConfig');
    console.log("Local Environment");
}
else if (process.env.NODE_ENV === "Development") {
    config = require('./config/DevConfig');
    console.log("Development Environment");
}
else if (process.env.NODE_ENV === "Production") {
    config = require('./config/ProdConfig');
    console.log("Production Environment");
}

var jwt = require('jsonwebtoken');
var routes = require('./routes');
var api = require('./routes/api');
var unirest = require('unirest');
//var azure = require('azure-storage');
//var tableSvc = azure.createTableService(config.azureStorage.storageAccountName, config.azureStorage.storageAccountKey);

// **** Passport authentication Azure AD
var AzureAdOAuth2Strategy = require('passport-azure-ad-oauth2').Strategy;

passport.use(new AzureAdOAuth2Strategy({
    clientID: config.creds.clientID,
    clientSecret: config.creds.clientSecret,
    callbackURL: config.creds.callbackURL,
    resource: config.creds.resource,
    tenant: config.creds.tenant
},
function (accessToken, refresh_token, params, profile, done) {
    // currently we can't find a way to exchange access token by user info (see userProfile implementation), so
    // you will need a jwt-package like https://github.com/auth0/node-jsonwebtoken to decode id_token and get waad profile
    var userProfile = jwt.decode(params.id_token);
    userProfile.refreshToken = refresh_token;
    console.log("\n\n User name is : " + JSON.stringify(userProfile.unique_name));
    // store user in table

    //var entGen = azure.TableUtilities.entityGenerator;
    //var task = {
    //    PartitionKey: entGen.String("Sprinklr"),
    //    RowKey: entGen.String(userProfile.unique_name),
    //    name: entGen.String(userProfile.name),
    //    firstName: entGen.String(userProfile.given_name),
    //    lastName: entGen.String(userProfile.family_name),
    //};
    //tableSvc.insertEntity('users', task, function (error, result, response) {
    //    if (!error) {
    //        // Entity inserted
    //        console.log("\n\nUser Entity created");
    //    }
    //});

    userProfile.accessToken = accessToken;
    done(null, userProfile);
}));


passport.serializeUser(function (user, done) {
    // placeholder for custom user serialization
    // null is for errors
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    // placeholder for custom user deserialization.
    // null is for errors
    done(null, user);
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}


// *** APP configuration

var app = express();
var env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';
// view engine setup

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
//app.set('view engine', 'jade');
//app.use(morgan('dev'));

// app.use(favicon(__dirname + '/public/img/favicon.ico'));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(expressSession({ secret: 'keyboard cat', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
//app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));



//*** APP routes
//app.use('/', routes);
//app.use('/users', users);
// serve index and view partials
//app.get('/', routes.index);
app.get('/partials/:name', routes.partials);

app.get('/', ensureAuthenticated, function (req, res) {
    res.render('index', { user: req.user });
});

app.get('/auth/azureadoauth2',
  passport.authenticate('azure_ad_oauth2'));

app.get('/auth/azureadoauth2/callback',
  passport.authenticate('azure_ad_oauth2', { failureRedirect: '/login' }),
  function (req, res) {
      console.log("\n\n\nsuccessfull authentication");
      // Successful authentication, redirect home.
      res.redirect('/');
  });
app.get('/login',
 passport.authenticate('azure_ad_oauth2', { failureRedirect: '/login' }),
  function (req, res) {
      // Successful authentication, redirect home.
      res.redirect('/');
  });


app.post('/auth/azureadoauth2/callback',
  passport.authenticate('azure_ad_oauth2', { failureRedirect: '/login' }),
  function (req, res) {
      res.redirect('/');
  });

app.get('/logout', function (req, res) {
    req.logout();
    console.log("return from Azure AAD #######");
    res.redirect('https://login.windows.net/' + config.creds.tenant + '/oauth2/logout?post_logout_redirect_uri=' + config.creds.callbackURL);
});


// ****** API Routes ********

app.get('/api/init', ensureAuthenticated, function (req, res) {
    console.log("\nGroupname" + config.PowerBI.GroupName)
    res.json(config.PowerBI.GroupName);
});

app.get('/api/user', ensureAuthenticated, function (req, res) {
    res.json(req.user);
});

// to get access token for audience resource https://management.core.windows.net/
app.get('/api/azuremanagement/getAccessToken', ensureAuthenticated, function (req, res) {
    var url = "https://login.microsoftonline.com/" + config.creds.tenant + "/oauth2/token?api-version=1.0 HTTP/1.1";
    //var token = "Bearer " + req.user.accessToken;
    unirest.post(url)
        .send({
            "grant_type": "client_credentials",
            "resource": "https://management.core.windows.net/",
            "client_id": config.creds.clientID,
            "client_secret": config.creds.clientSecret
        })
        .end(function (data) {
            res.json(data.body);
        });
});

// to get access token for audience resource https://management.core.windows.net/
app.get('/api/powerbi/refreshToken', ensureAuthenticated, function (req, res) {
    var url = "https://login.microsoftonline.com/" + config.creds.tenant + "/oauth2/token?api-version=1.0 HTTP/1.1";
    unirest.post(url)
        .send({
            "grant_type": "refresh_token",
            "resource": config.creds.resource,
            "client_id": config.creds.clientID,
            "client_secret": config.creds.clientSecret,
            "refresh_token": req.user.refreshToken
        })
        .end(function (data) {
            res.json(data.body);
        });
});


app.get('*', routes.index);


/// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace

if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
            title: 'error'
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    // res.render("/partials");
    /*
    res.render('error', {
        message: err.message,
        error: {},
        title: 'error'
    });*/

});

module.exports = app;
