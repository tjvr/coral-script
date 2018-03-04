'use strict';

const http = require('http');
const express = require('express');
const passport = require('passport');
const request = require('request');
const OAuth2Strategy = require('passport-oauth2');
const session = require('express-session');

let r = request.defaults({baseUrl: 'https://api.monzo.com/', json: true});

passport.use(new OAuth2Strategy({
  authorizationURL: 'https://auth.monzo.com',
  tokenURL: 'https://api.monzo.com/oauth2/token',
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: `${process.env.ROOT_URL}/callback`,
  state: true
}, (accessToken, refreshToken, profile, done) => done(null, Object.assign({accessToken, refreshToken}, profile))));
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

const app = express();
app.set('view engine', 'pug');
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.get('/login', passport.authenticate('oauth2'));
app.get('/callback', passport.authenticate('oauth2', {successRedirect: '/', failureRedirect: '/login'}));
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});


app.get('/', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.render('index');
  }
  r = r.defaults({auth: {bearer: req.user.accessToken}});
  r('/ping/whoami', (error, response, body) => {
    if (response && http.STATUS_CODES[response.statusCode] === 'Unauthorized') {
      req.logout();
      return res.redirect('/');
    }
    const {user_id} = body;
    r('/accounts', (error, response, body) => {
      const {accounts: [account]} = body;
      r('/transactions', {qs: {account_id: account.id}}, (error, response, body) => {
        const {transactions} = body;
        res.render('index', {user_id, account, transactions});
      });
    });
  });
});

app.listen(process.env.PORT);
