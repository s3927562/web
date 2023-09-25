// RMIT University Vietnam
// Course: COSC2430 Web Programming
// Semester: 2023B
// Assessment: Assignment 2
// Author: Tran Thanh Tung
// ID: s3927562
// Acknowledgement:
// RMIT University, COSC2430 Course, Week 1 - 12 Lectures
// Login form using Node.js and MongoDB - GeeksforGeeks:
// https://www.geeksforgeeks.org/login-form-using-node-js-and-mongodb/
// regular expression - Regex for Password. Restricting Special Characters – Unix & Linux Stack Exchange:
// https://unix.stackexchange.com/questions/391866/regex-for-password-restricting-special-characters
// javascript - What is the proper way to validate email uniqueness with mongoose?:
// https://stackoverflow.com/questions/59212143/what-is-the-proper-way-to-validate-email-uniqueness-with-mongoose
// validation - Best way to alphanumeric check in JavaScript – Stack Overflow:
// https://stackoverflow.com/questions/4434076/best-way-to-alphanumeric-check-in-javascript
// How to check a key exists in JavaScript object ? - GeeksforGeeks:
// https://www.geeksforgeeks.org/how-to-check-a-key-exists-in-javascript-object/
// Mongoose v7.5.2 Documentation:
// https://mongoosejs.com/docs
// Upload and Retrieve Image on MongoDB using Mongoose - GeeksforGeeks:
// https://www.geeksforgeeks.org/upload-and-retrieve-image-on-mongodb-using-mongoose/
// @types/express-session@1.17.8 – jsDoc.io:
// https://www.jsdocs.io/package/@types/express-session#SessionOptions.cookie
// Node.js authentication using Passportjs and passport-local-mongoose – GeeksforGeeks:
// https://www.geeksforgeeks.org/node-js-authentication-using-passportjs-and-passport-local-mongoose/
// node.js - Passport authenticate callback is not passed req and res – Stack Overflow:
// https://stackoverflow.com/questions/21855650/passport-authenticate-callback-is-not-passed-req-and-res
// node.js - File uploading with Express 4.0: req.files undefined – Stack Overflow:
// https://stackoverflow.com/questions/23114374/file-uploading-with-express-4-0-req-files-undefined
// node.js - How to get the session value in ejs – Stack Overflow:
// https://stackoverflow.com/questions/37183766/how-to-get-the-session-value-in-ejs
// node.js - Access the list of valid values for an Enum field in a Mongoose.js Schema:
// https://stackoverflow.com/questions/10640749/access-the-list-of-valid-values-for-an-enum-field-in-a-mongoose-js-schema
// javascript - Difference between assigning to res and res.locals in node.js (Express):
// https://stackoverflow.com/questions/24072333/difference-between-assigning-to-res-and-res-locals-in-node-js-express
// Redirecting to previous page after authentication in node.js using passport.js – Stack Overflow:
// https://stackoverflow.com/questions/13335881/redirecting-to-previous-page-after-authentication-in-node-js-using-passport-js

// Import modules
const mongoose = require('mongoose'),
    User = require('./User'),
    Product = require('./Product');

// Define schema
const orderSchema = new mongoose.Schema({
    customer: { // Customer object id to retrieve customer info
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "An order must be associated with a customer"],
        validate: [
            {
                validator: async function isCustomer(customer) {
                    const user = await User.findOne({ _id: customer._id });
                    if (user) {
                        return user.userType == 'customer';
                    }
                    return false;
                },
                message: "Customer doesn't exist"
            }
        ]
    },
    products: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            validate: {
                validator: async function isProduct(product) {
                    const item = await Product.findOne({ _id: product._id });
                    if (item) {
                        return true;
                    }
                    return false;
                },
                message: "Product doesn't exist"
            }
        }],
        required: [true, 'An order cannot by empty']
    },
    distributionHub: {
        type: String,
        enum: {
            values: ['Ha Noi', 'Da Nang', 'Ho Chi Minh'],
            message: "{VALUE} is not a valid distribution hub"
        },
        required: [true, "Distribution hub is required"]
    },
    status: {
        type: String,
        enum: {
            values: ['active', 'delivered', 'canceled'],
            message: '{VALUE} is not a valid order status'
        },
        required: [true, 'Order status is required'],
        default: 'active'
    }
}, {
    virtuals: {
        total: {
            get() {
                var total = 0;

                // Get the price of all products in the array then add altogether
                this.populate('products.product', 'price');
                for (let i = 0; i < this.products.length; i++) {
                    total += this.products[i].price;
                }
                return total;
            }
        }
    }
});

// Export model from the schema
module.exports = mongoose.model('Order', orderSchema);