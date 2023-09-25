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
    User = require('./User');

// Define schema
const productSchema = new mongoose.Schema({
    vendor: { // Vendor object id to get vendor info
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "A product must be associated with a vendor"],
        validate: {
            validator: async function isVendor(vendor) {
                const user = await User.findOne({ _id: vendor._id });
                if (user) {
                    return user.userType == 'vendor';
                }
                return false;
            },
            message: "Vendor doesn't exist"
        }
    },
    name: { // 10-20 characters
        type: String,
        minLength: [10, "Product name must be 10-20 characters"],
        maxLength: [20, "Product name must be 10-20 characters"],
        required: [true, "Product name is required"]
    },
    price: {
        type: Number,
        min: [0.01, "Price must be a positive number with maximum 2 decimal places"],
        required: [true, "Price is required"]
    },
    picture: {
        type: {
            data: Buffer,
            contentType: String
        },
        required: [true, "Product picture is required"]
    },
    description: {
        type: String,
        maxLength: [500, "Product description must not exceed 500 characters"],
        required: [true, "Product description is required"]
    }
});

// Export model from the schema
module.exports = mongoose.model('Product', productSchema);