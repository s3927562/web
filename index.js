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
    Product = require('./models/Product'),
    Cart = require('./models/Cart'),
    Order = require('./models/Order');

// Mongoose Database
mongoose.connect('mongodb+srv://s3927562:yGy6bwv%21yiCZaAMW@full-stack-web-applicat.wj1vg7k.mongodb.net/test?retryWrites=true&w=majority&appName=AtlasApp')
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((error) => console.log(error.message));


// Express
const app = express();
app.use(express.urlencoded({ extended: true }));  // Parse incoming form data
app.use(expressFileUpload());  // Parse file uploads

// Templating with EJS
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Authentication and Sessions with Passport
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

// Response local variables
app.use(function (req, res, next) {
    res.locals.user = req.user;
    res.locals.possibleDistributionHubs = User.possibleDistributionHubs();
    next();
});

// Routing
// Static pages
app.get('/', (req, res) => {
    res.render('index');
});

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

// Register
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

    // At least 1 lowercase, 1 uppercase, 1 digit, 1 symbol, no other types of characters
    const passwordRegex = /^(?=[0-9a-zA-Z!@#$%^&*]{8,20}$)(?=[^a-z]*[a-z])(?=[^A-Z]*[A-Z])(?=[^0-9]*[0-9])(?=[^!@#$%^&*]*[!@#$%^&*]).*/;

    if (passwordRegex.test(req.body.password)) {
        User.register(user, req.body.password)
            .then((user) => {
                // Create a cart if new user is a customer
                if (user.userType == 'customer') {
                    const cart = new Cart({
                        customer: user._id,
                    });
                    cart.save();
                }

                req.logIn(user, (err) => {
                    if (err) {
                        return res.render('register', { error: err['message'] });
                    }

                    if (user.userType == 'vendor') {
                        return res.redirect('/shop');
                    } else if (user.userType == 'shipper') {
                        return res.redirect('/orders');
                    }
                    return res.redirect('/products');
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

// Log in and log out
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

// Account info
app.get('/account', connectEnsureLogin.ensureLoggedIn('/login'), (req, res) => {
    res.render('account');
});

// Product pages (multiple and single)
app.get('/products', (req, res) => {
    var query = {};

    if (typeof req.query.productName != 'undefined' && req.query.productName != '') {
        query.name = {
            "$regex": req.query.productName,
            "$options": "i"
        };
    }

    if (typeof req.query.maxPrice != 'undefined' && req.query.maxPrice != '') {
        if (typeof query.price == 'undefined') {
            query.price = {};
        }
        query.price.$lte = req.query.maxPrice;
    }

    if (typeof req.query.minPrice != 'undefined' && req.query.minPrice != '') {
        if (typeof query.price == 'undefined') {
            query.price = {};
        }
        query.price.$gte = req.query.minPrice;
    }

    Product.find(query)
        .then((products) => res.render('products', { products: products }))
        .catch((error) => res.render('products', { error: error }));
});

app.get('/products/:id', (req, res) => {
    Product.findById(req.params.id).populate('vendor', 'businessName')
        .then((product) => res.render('product', { product: product }))
        .catch(() => res.render('not-found'));
});

// Vendor: View own products
app.get('/shop', connectEnsureLogin.ensureLoggedIn('/login'), (req, res) => {
    if (req.user.userType != 'vendor') {
        return res.render('forbidden');
    }
    Product.find({ vendor: req.user._id })
        .then((products) => res.render('shop', { products: products }))
        .catch((error) => res.render('shop', { error: error }));
});

// Vendor: Add new product
app.get('/shop/add', connectEnsureLogin.ensureLoggedIn('/login'), (req, res) => {
    if (req.user.userType != 'vendor') {
        return res.render('forbidden');
    }
    res.render('add-product');
});

app.post('/shop/add', connectEnsureLogin.ensureLoggedIn('/login'), (req, res) => {
    if (req.user.userType != 'vendor') {
        return res.render('forbidden');
    }

    const product = new Product({
        vendor: req.user._id,
        name: req.body.name,
        price: req.body.price,
        picture: req.files.picture,
        description: req.body.description,
    });
    product.save()
        .then(() => res.redirect('/shop'))
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

// Customer cart
app.get('/cart', connectEnsureLogin.ensureLoggedIn('/login'), (req, res) => {
    if (req.user.userType != 'customer') {
        return res.render('forbidden');
    }

    Cart.findOne({ customer: req.user._id }).populate('products')
        .then((cart) => res.render('cart', { cart: cart }))
        .catch((error) => console.log(error));
});

app.post('/cart/add/:id', connectEnsureLogin.ensureLoggedIn('/login'), (req, res) => {
    if (req.user.userType != 'customer') {
        return res.render('forbidden');
    }

    Cart.findOne({ customer: req.user._id })
        .then((cart) => {
            cart.products.push(req.params.id);
            cart.save()
                .then(() => res.redirect('/cart'));
        })
        .catch((error) => res.render('cart', { error: error }));
});

app.post('/cart/remove/:index', connectEnsureLogin.ensureLoggedIn('/login'), (req, res) => {
    if (req.user.userType != 'customer') {
        return res.render('forbidden');
    }

    Cart.findOne({ customer: req.user._id })
        .then((cart) => {
            cart.products.splice(req.params.index, 1);
            cart.save()
                .then(() => res.redirect('/cart'));
        })
        .catch((error) => res.render('cart', { error: error }));
});

app.post('/cart/order', connectEnsureLogin.ensureLoggedIn('/login'), (req, res) => {
    if (req.user.userType != 'customer') {
        return res.render('forbidden');
    }

    Cart.findOne({ customer: req.user._id })
        .then((cart) => {
            const order = new Order({
                customer: cart.customer,
                products: cart.products,
                distributionHub: res.locals.possibleDistributionHubs[Math.floor(Math.random() * res.locals.possibleDistributionHubs.length)]
            });

            order.save()
                .then(() => {
                    cart.products = [];
                    cart.save()
                        .then(() => res.redirect('/cart'));
                });
        })
        .catch((error) => res.render('cart', { error: error }));
});

// Shipper orders
app.get('/orders', connectEnsureLogin.ensureLoggedIn('/login'), (req, res) => {
    if (req.user.userType != 'shipper') {
        return res.render('forbidden');
    }

    Order.find({ distributionHub: req.user.distributionHub, status: 'active' })
        .populate('customer', 'name profilePicture address')
        .populate('products')
        .then((orders) => res.render('orders', { orders: orders }))
        .catch((error) => res.render('orders', { error: error }));
});

app.get('/orders/:id', connectEnsureLogin.ensureLoggedIn('/login'), (req, res) => {
    if (req.user.userType != 'shipper') {
        return res.render('forbidden');
    }

    Order.findOne({ _id: req.params.id, distributionHub: req.user.distributionHub, status: 'active' })
        .populate('customer', 'name address')
        .populate('products')
        .then((order) => res.render('order', { order: order }))
        .catch((error) => res.render('order', { error: error }));
});

app.post('/orders/:id/:status', connectEnsureLogin.ensureLoggedIn('/login'), (req, res) => {
    if (req.user.userType != 'shipper') {
        return res.render('forbidden');
    }

    Order.findOne({ _id: req.params.id, distributionHub: req.user.distributionHub, status: 'active' })
        .then((order) => {
            order.status = req.params.status;
            order.save()
                .then(() => res.redirect('/orders'));
        })
        .catch((error) => res.render('order', { error: error }));
});

// Catch invalid routes
app.get('*', (req, res) => {
    res.render('not-found');
});

app.post('*', (req, res) => {
    res.render('forbidden');
});

// Run
app.listen(3000, () => {
    console.log('Server is up on port 3000');
});