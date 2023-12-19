const https = require('https');
const express = require('express');
const fs = require('fs');
const passport = require('passport');
const { Strategy } = require('passport-google-oauth20');
require('dotenv').config({ path : '.env', override: true});
const path = require('path');
const cors = require('cors');
const cookieSession = require('cookie-session');






const PORT = process.env.PORT || 3000
const config = {
    CLIENT_ID : process.env.CLIENT_ID,
    CLIENT_SECRET : process.env.CLIENT_SECRET,
    COOKIE_KEY : process.env.COOKIE_KEY,
    OLD_COOKIE_KEY : process.env.OLD_COOKIE_KEY
}

const AUTH_OPTIONS = {
    callbackURL : '/auth/google/callback',
    clientID : config.CLIENT_ID,
    clientSecret : config.CLIENT_SECRET,
    proxy : true,
}


function verifyCallback(accessToken, refreshToken, profile, done){
    console.log("google profile : " ,profile.id);
    done(null, profile)
}

passport.use(new Strategy(AUTH_OPTIONS, verifyCallback))
// save into cookie
passport.serializeUser((user, done)=>{
        done(null, user.id);
})
//read from cookie
passport.deserializeUser((obj,done)=>{
    done(null, obj);
})

const app = express()

app.use(cors());

app.use(cookieSession({
    name : "session",
    maxAge : 1000 * 60 * 60 * 24,
    keys : [config.COOKIE_KEY, config.OLD_COOKIE_KEY]
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(express.static(path.join(__dirname, 'public')))


 

function checkLogin(req, res,next){
    const isLoggedIn = req.isAuthenticated() ;
    if(!isLoggedIn){
        return res.status(401).json({
            error : 'user not logged in'
        })
    }
    next();
}





app.get("/loginfail",(req, res)=>{
    res.send("failed to login");
})

app.get('/auth/google', passport.authenticate('google', {
        scope : ['email', 'profile']
    })
)

app.get('/auth/google/callback', 
    passport.authenticate('google', {
        failureRedirect : '/loginfail',
        successRedirect : 'https://localhost:3000/',
        session: true
    }), 
    (req, res)=>{
        console.log("google callbacked success")
    }
)

app.get('/auth/logout', (req, res)=>{
    req.logout();
    return res.redirect('/');

})

app.get('/', (req, res)=>{
    res.sendFile("index.html")
})



app.get('/secret', checkLogin, (req, res)=>{
    res.send(req.user)
})



https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
  }, app).listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
  });