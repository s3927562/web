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
        validate: [
            {
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
            {
                validator: function isUnique(username) {
                    const user = this.constructor.findOne({ username });
                    if (user) {
                        if (this.username == user.username) {
                            return false;
                        }
                    }
                    return true;
                },
                message: "Username is already in use"
            }
        ]

        // Uniqueness is managed by Passport
    },
    profilePicture: {
        data: Buffer,
        contentType: String
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
            values: ['hanoi', 'danang', 'hcm'],
            message: "{VALUE} is not a valid distribution hub"
        },
        required: [
            function isRequired() { return this.userType == 'shipper'; },
            "Distribution hub is required"
        ]
    }
});

// Schema plugins
userSchema.plugin(passportLocalMongoose); // Connect Passport with MongooseDB\

// Export model from the schema
module.exports = mongoose.model('User', userSchema);