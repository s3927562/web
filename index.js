/*
https://www.geeksforgeeks.org/login-form-using-node-js-and-mongodb/
https://unix.stackexchange.com/questions/391866/regex-for-password-restricting-special-characters
https://stackoverflow.com/questions/59212143/what-is-the-proper-way-to-validate-email-uniqueness-with-mongoose
https://stackoverflow.com/questions/4434076/best-way-to-alphanumeric-check-in-javascript
https://www.geeksforgeeks.org/how-to-check-a-key-exists-in-javascript-object/
https://mongoosejs.com/docs
https://www.geeksforgeeks.org/upload-and-retrieve-image-on-mongodb-using-mongoose/
https://www.jsdocs.io/package/@types/express-session#SessionOptions.cookie
https://www.geeksforgeeks.org/node-js-authentication-using-passportjs-and-passport-local-mongoose/
https://stackoverflow.com/questions/21855650/passport-authenticate-callback-is-not-passed-req-and-res
*/

// Import modules
const express = require('express'),
    expressSession = require('express-session'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    passportLocal = require('passport-local'),
    passportLocalMongoose = require('passport-local-mongoose'),
    connectEnsureLogin = require('connect-ensure-login'),
    User = require('./models/User');


// Mongoose Database
mongoose.connect('mongodb+srv://s3927562:yGy6bwv%21yiCZaAMW@full-stack-web-applicat.wj1vg7k.mongodb.net/?retryWrites=true&w=majority&appName=AtlasApp')
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((error) => console.log(error.message));


// Express
const app = express();
app.use(express.urlencoded({ extended: true }));  // Parse incoming form data

// Templating with EJS
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Sessions with Passport
app.use(expressSession({
    secret: 'WnFKN1v_gUcgmUVZnjjjGXGwk557zBSO',
    cookie: {
        maxAge: 2592000000 // 30 days
    },
    resave: 'false',
    rolling: 'true',
    saveUninitialized: 'false',
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// Routing
app.get('/', (req, res) => {
    res.render('blank');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    var user;

    // Prevent extra data from erroneous requests
    if (req.body.userType == 'vendor') {
        user = new User({
            userType: req.body.userType,
            username: req.body.username,
            profilePicture: req.body.profilePicture,
            businessName: req.body.businessName,
            businessAddress: req.body.businessAddress,
        });
    } else if (req.body.userType == 'customer') {
        user = new User({
            userType: req.body.userType,
            username: req.body.username,
            profilePicture: req.body.profilePicture,
            name: req.body.name,
            address: req.body.address
        });
    } else if (req.body.userType == 'shipper') {
        user = new User({
            userType: req.body.userType,
            username: req.body.username,
            profilePicture: req.body.profilePicture,
            distributionHub: req.body.distributionHub
        });
    } else {
        const errMsg = `${req.body.userType} is not a valid user type`;
        return res.render('register', {
            error: errMsg,
            userType: req.body.userType,
            username: req.body.username,
            businessName: req.body.businessName,
            businessAddress: req.body.businessAddress,
            name: req.body.name,
            address: req.body.address,
            distributionHub: req.body.distributionHub
        });
    }

    const passwordRegex = /^(?=[0-9a-zA-Z!@#$%^&*]{8,20}$)(?=[^a-z]*[a-z])(?=[^A-Z]*[A-Z])(?=[^0-9]*[0-9])(?=[^!@#$%^&*]*[!@#$%^&*]).*/;

    if (passwordRegex.test(req.body.password)) {
        User.register(user, req.body.password)
            .then((user) => res.send(user))
            .catch((err) => {
                var errMsg = "";
                if ('errors' in err) { // MongoDB validation errors
                    Object.entries(err['errors']).forEach(([k, v]) => {
                        errMsg = errMsg + v['message'] + '\n';
                    });
                } else { // Passport validation errors
                    errMsg = err['message'];
                }
                return res.render('register', {
                    error: errMsg,
                    userType: req.body.userType,
                    username: req.body.username,
                    businessName: req.body.businessName,
                    businessAddress: req.body.businessAddress,
                    name: req.body.name,
                    address: req.body.address,
                    distributionHub: req.body.distributionHub
                });
            });
    } else {
        const errMsg = "Password must be 8-20 characters and contains:\n \
    - At least one lowercase character\n \
    - At least one uppercase character\n \
    - At least one digit\n \
    - At least one of the characters !@#$%^&*\n \
    - No other kinds of characters";
        return res.render('register', {
            error: errMsg,
            userType: req.body.userType,
            username: req.body.username,
            businessName: req.body.businessName,
            businessAddress: req.body.businessAddress,
            name: req.body.name,
            address: req.body.address,
            distributionHub: req.body.distributionHub
        });
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res, next) => {
    const returnTo = req.session.returnTo;
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.render('login', { error: err['message'] });
        }
        if (!user) {
            return res.render('login', { error: info['message'] });
        }

        req.logIn(user, (err) => {
            if (err) {
                return res.render('login', { error: err['message'] });
            }
            return res.redirect(typeof returnTo != 'undefined' ? returnTo : '/account');
        });
    })(req, res, next);
});

app.post('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

app.get('/account', connectEnsureLogin.ensureLoggedIn('/login'), (req, res) => {
    res.send(req.user.userType);
});

// Run
app.listen(3000, () => {
    console.log('Server is up on port 3000');
});