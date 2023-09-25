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
    passportLocalMongoose = require('passport-local-mongoose');

// Define schema
const userSchema = new mongoose.Schema({
    // Shared fields
    userType: {
        type: String,
        enum: {
            values: ['vendor', 'customer', 'shipper'],
            message: "{VALUE} is not a valid user type"
        },
        required: [true, "User type is required"]
    },
    username: { // 8-15 alphanumeric characters, required, unique
        type: String,
        minLength: [8, "Username must be 8-15 alphanumeric characters"],
        maxLength: [15, "Username must be 8-15 alphanumeric characters"],
        required: [true, "Username is required"],
        validate: {
            validator: function isAlphaNumeric(str) {
                for (let i = 0, len = str.length; i < len; i++) {
                    const charCode = str.charCodeAt(i);
                    if (!(charCode > 47 && charCode < 58) && // Numeric (0-9)
                        !(charCode > 64 && charCode < 91) && // Upper alpha (A-Z)
                        !(charCode > 96 && charCode < 123)) { // Lower alpha (a-z)
                        return false;
                    }
                }
                return true;
            },
            message: "Username must be 8-15 alphanumeric characters"
        },
        // Uniqueness is managed by Passport
        unique: true // This is for indexing purpose only
    },
    profilePicture: { // Required
        type: {
            data: Buffer,
            contentType: String
        },
        required: [true, "Profile picture is required"]
    },
    // Password salt and hash is managed by Passport

    // Vendor fields
    businessName: { // Minimum 5 characters, required if is vendor, unique
        type: String,
        minLength: [5, "Name must be at least 5 characters"],
        validate: {
            validator: async function isUnique(businessName) {
                const user = await this.constructor.findOne({ businessName });
                if (user) {
                    if (this.businessName == user.businessName) {
                        return false;
                    }
                }
                return true;
            },
            message: "Business name is already in use"
        },
        required: [
            function isRequired() { return this.userType == 'vendor'; },
            "Business name is required"
        ]
    },
    businessAddress: { // Minimum 5 characters, required if is vendor, unique
        type: String,
        minLength: [5, "Address must be at least 5 characters"],
        validate: {
            validator: async function isUnique(businessAddress) {
                const user = await this.constructor.findOne({ businessAddress });
                if (user) {
                    if (this.businessAddress == user.businessAddress) {
                        return false;
                    }
                }
                return true;
            },
            message: "Business address is already in use"
        },
        required: [
            function isRequired() { return this.userType == 'vendor'; },
            "Business address is required"
        ]
    },

    // Customer fields
    name: { // Minimum 5 characters, required if is customer
        type: String,
        minLength: [5, "Name must be at least 5 characters"],
        required: [
            function isRequired() { return this.userType == 'customer'; },
            "Name is required"
        ]
    },
    address: { // Minimum 5 characters, required if is customer
        type: String,
        minLength: [5, "Address must be at least 5 characters"],
        required: [
            function isRequired() { return this.userType == 'customer'; },
            "Address is required"
        ]
    },

    distributionHub: { // Required if is shipper
        type: String,
        enum: {
            values: ['Ha Noi', 'Da Nang', 'Ho Chi Minh'],
            message: "{VALUE} is not a valid distribution hub"
        },
        required: [
            function isRequired() { return this.userType == 'shipper'; },
            "Distribution hub is required"
        ]
    }
});

// Schema plugins
userSchema.plugin(passportLocalMongoose); // Connect Passport with MongooseDB

// Export model from the schema
module.exports = mongoose.model('User', userSchema);