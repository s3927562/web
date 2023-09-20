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
https://stackoverflow.com/questions/23114374/file-uploading-with-express-4-0-req-files-undefined
https://stackoverflow.com/questions/37183766/how-to-get-the-session-value-in-ejs
*/

// Import modules
const express = require('express'),
    expressFileUpload = require('express-fileupload'),
    expressSession = require('express-session'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    passportLocal = require('passport-local'),
    passportLocalMongoose = require('passport-local-mongoose'),
    connectEnsureLogin = require('connect-ensure-login'),
    User = require('./models/User'),
    Product = require('./models/Product');


// Mongoose Database
mongoose.connect('mongodb+srv://s3927562:yGy6bwv%21yiCZaAMW@full-stack-web-applicat.wj1vg7k.mongodb.net/?retryWrites=true&w=majority&appName=AtlasApp')
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((error) => console.log(error.message));


// Express
const app = express();
app.use(express.urlencoded({ extended: true }));  // Parse incoming form data
app.use(expressFileUpload());  // Parse file uploads

// Templating with EJS
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Sessions with Passport
app.use(expressSession({
    secret: 'WnFKN1v_gUcgmUVZnjjjGXGwk557zBSO',
    resave: 'false',
    saveUninitialized: 'false',
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
    res.locals.user = req.user;
    res.locals.possibleDistributionHubs = User.possibleDistributionHubs();
    next();
});

// Routing
app.get('/', (req, res) => {
    res.render('index');
});

// Static pages
app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/copyright', (req, res) => {
    res.render('copyright');
});

app.get('/privacy', (req, res) => {
    res.render('privacy');
});

app.get('/help', (req, res) => {
    res.render('help');
});

// Authentication
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
            profilePicture: req.files.profilePicture,
            businessName: req.body.businessName,
            businessAddress: req.body.businessAddress,
        });
    } else if (req.body.userType == 'customer') {
        user = new User({
            userType: req.body.userType,
            username: req.body.username,
            profilePicture: req.files.profilePicture,
            name: req.body.name,
            address: req.body.address
        });
    } else if (req.body.userType == 'shipper') {
        user = new User({
            userType: req.body.userType,
            username: req.body.username,
            profilePicture: req.files.profilePicture,
            distributionHub: req.body.distributionHub
        });
    } else {
        const errMsg = `${req.body.userType} is not a valid user type`;
        return res.render('register', { error: errMsg });
    }

    const passwordRegex = /^(?=[0-9a-zA-Z!@#$%^&*]{8,20}$)(?=[^a-z]*[a-z])(?=[^A-Z]*[A-Z])(?=[^0-9]*[0-9])(?=[^!@#$%^&*]*[!@#$%^&*]).*/;

    if (passwordRegex.test(req.body.password)) {
        User.register(user, req.body.password)
            .then((user) => {
                req.logIn(user, (err) => {
                    if (err) {
                        return res.render('register', { error: err['message'] });
                    }
                    return res.redirect('/account');
                });
            })
            .catch((err) => {
                var errMsg = "";
                if ('errors' in err) { // MongoDB validation errors
                    Object.entries(err['errors']).forEach(([k, v]) => {
                        if (errMsg != "") {
                            errMsg += ', ';
                        }
                        errMsg = errMsg + v['message'];
                    });
                } else { // Passport validation errors
                    errMsg = err['message'];
                }
                return res.render('register', { error: errMsg });
            });
    } else {
        const errMsg = "Password requirements not met";
        return res.render('register', { error: errMsg });
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res, next) => {
    const returnTo = req.session.returnTo;  // Bug in successReturnToOrRedirect
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
            if (typeof returnTo != 'undefined') {
                return res.redirect(returnTo);
            } else if (user.userType == 'vendor') {
                return res.redirect('/shop');
            } else if (user.userType == 'shipper') {
                return res.redirect('/orders');
            }
            return res.redirect('/products');
        });
    })(req, res, next);
});

app.post('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.locals.user = undefined;
    });
    res.redirect('/');
});

app.get('/account', connectEnsureLogin.ensureLoggedIn('/login'), (req, res) => {
    res.render('account');
});

app.get('/products', (req, res) => {
    Product.find({})
        .then((products) => res.render('products', { products: products }))
        .catch((error) => res.render('products', { error: error }));
});

app.get('/products/:id', (req, res) => {
    Product.findOne({ _id: req.params.id }).populate('vendor', 'businessName')
        .then((product) => res.render('product', { product: product }))
        .catch((error) => res.redirect('/not-found'));
});

// Vendor routes
app.get('/shop', connectEnsureLogin.ensureLoggedIn('/login'), (req, res) => {
    if (req.user.userType != 'vendor') {
        return res.redirect('/forbidden');
    }
    Product.find({ vendor: req.user._id })
        .then((products) => res.render('shop', { products: products }))
        .catch((error) => res.render('shop', { error: error }));
});

app.get('/shop/add', connectEnsureLogin.ensureLoggedIn('/login'), (req, res) => {
    if (req.user.userType != 'vendor') {
        return res.redirect('/forbidden');
    }
    res.render('add-product');
});

app.post('/shop/add', connectEnsureLogin.ensureLoggedIn('/login'), (req, res) => {
    if (req.user.userType != 'vendor') {
        return res.redirect('/forbidden');
    }
    const product = new Product({
        vendor: req.user._id,
        name: req.body.name,
        price: req.body.price,
        picture: req.files.picture,
        description: req.body.description,
    });
    product.save()
        .then((product) => res.redirect('/shop'))
        .catch((err) => {
            var errMsg = "";
            if ('errors' in err) { // MongoDB validation errors
                Object.entries(err['errors']).forEach(([k, v]) => {
                    if (errMsg != "") {
                        errMsg += ', ';
                    }
                    errMsg = errMsg + v['message'];
                });
            }
            return res.render('add-product', { error: errMsg });
        });
});

// Customer routes
app.get('cart', (req, res) => {
    res.render('cart');
});

app.post('cart/add/:id', (req, res) => {
    res.render('cart');
});

app.post('cart/remove/:id', (req, res) => {
    res.render('cart');
});

// Catch invalid routes
app.get('/not-found', (req, res) => {
    res.render('not-found');
});

app.get('/forbidden', (req, res) => {
    res.render('forbidden');
});

app.get('*', (req, res) => {
    res.redirect('/not-found');
});

app.post('*', (req, res) => {
    res.redirect('/forbidden');
});

// Run
app.listen(3000, () => {
    console.log('Server is up on port 3000');
});