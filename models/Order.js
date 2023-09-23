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