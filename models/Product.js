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