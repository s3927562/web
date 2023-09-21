// Import modules
const mongoose = require('mongoose'),
    User = require('./User'),
    Product = require('./Product');

// Define schema
const cartSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "A cart must be associated with a customer"],
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
            },
            {
                validator: async function isUnique(customer) {
                    const cart = await this.constructor.findOne({ customer: customer });
                    if (cart) {
                        return cart._id.equals(this._id);
                    }
                    return true;
                },
                message: "Each customer can only have one cart"
            }
        ],
        unique: true
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
        }]
    }
}, {
    virtuals: {
        total: {
            get() {
                var total = 0;
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
module.exports = mongoose.model('Cart', cartSchema);