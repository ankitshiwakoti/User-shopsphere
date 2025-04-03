import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    oldPrice: {
        type: Number,
        min: 0
    },
    discount: {
        type: Number,
        min: 0,
        max: 100
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Fruits & Vegetables', 'Meat & Fish', 'Snacks', 'Beverages', 'Beauty & Health', 'Bread & Bakery']
    },
    badges: [{
        type: String,
        enum: ['ORGANIC', 'COLD SALE']
    }],
    megaRolls: {
        type: Number,
        min: 0
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    numReviews: {
        type: Number,
        default: 0
    },
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String, required: true }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Static methods
productSchema.statics.findAll = async function() {
    return this.find({});
};

productSchema.statics.findById = async function(id) {
    return this.findOne({ _id: id });
};

productSchema.statics.create = async function(productData) {
    const product = new this(productData);
    return product.save();
};

const Product = mongoose.model('Product', productSchema);

export default Product; 