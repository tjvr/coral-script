'use strict';

const path = require('path');
const http = require('http');

const express = require('express');
const passport = require('passport');
const request = require('request');
const OAuth2Strategy = require('passport-oauth2');
const session = require('express-session');
const bodyParser = require('body-parser')

const coral = require('./interpreter')

const api = request.defaults({baseUrl: 'https://api.monzo.com/', json: true});

const app = express();
app.set('view engine', 'pug');
app.use(bodyParser.json());

app.use(express.static('public'))

if (!process.env.access_token) {
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
}

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

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

const authenticated = func => (req, res) => {
  if (process.env.access_token) {
    const r = api.defaults({auth: {bearer: process.env.access_token}});
    return func(req, res, r)
  }

  if (!req.isAuthenticated()) {
    res.status(401);
    return res.send({error: "not authed"});
  }
  const r = api.defaults({auth: {bearer: req.user.accessToken}});
  return func(req, res, r)
}

app.get('/config', authenticated((_, res, r) => {
  r('/ping/whoami', (error, response, body) => {
    if (response && http.STATUS_CODES[response.statusCode] === 'Unauthorized') {
      req.logout();
      return res.redirect('/');
    }
    
    const {user_id} = body;
    r('/accounts', (error, response, body) => {
      if (error) return res.status(500);
      
      const account = body.accounts.find(acc => acc.type == 'uk_retail')
      if (!account) {
        res.status(412);
        return res.send('no current account')
      }
      
      let pots, transactions
      
      r('/pots', (error, response, body) => {
        if (error) return res.status(500);
        pots = body.pots;
        finish();
      })
      
      r('/transactions', {qs: {account_id: account.id}, 'expand[]': 'merchant'}, (error, response, body) => {
        transactions = body.transactions;
        finish();
      });
      
      function finish() {
        if (pots === undefined || transactions === undefined) return
        res.send({
          user_id: user_id,
          account_id: account.id,
          pots: pots.filter(pot => !pot.deleted).map(({id, name}) => ({id, name})),
          transaction: transactions.pop(),
        });
      }
    });
  });

}))

app.post('/execute', authenticated(async (req, res, r) => {
  const {script, account_id, user_id} = req.body
  if (!script) { res.status(400); return res.send({error: "missing param: script"}) }
  if (!account_id) { res.status(400); return res.send({error: "missing param: account_id"}) }
  if (!user_id) { res.status(400); return res.send({error: "missing param: user_id"}) }

  const data = await coral(r, script, {
    user_id, account_id,
  })
  res.send(data)
}))

app.listen(process.env.PORT);
