import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true
    },
    shortDescription: {
        type: String,
        required: true,
        maxlength: 200
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative']
    },
    stock: {
        type: Number,
        required: [true, 'Product stock is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Product category is required']
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    images: [{
        url: {
            type: String,
            required: [true, 'At least one product image is required']
        },
        isMain: {
            type: Boolean,
            default: false
        }
    }],
    attributes: {
        color: [{
            type: String
        }],
        size: [{
            type: String
        }]
    },
    specifications: [{
        name: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: true
        }
    }],
    salesCount: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
productSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ 'attributes.color': 1 });
productSchema.index({ 'attributes.size': 1 });
productSchema.index({ featured: 1 });
productSchema.index({ salesCount: -1 });

// Add text indexes for search
productSchema.index({ 
    name: 'text', 
    description: 'text', 
    shortDescription: 'text',
    category: 'text',
    'attributes.color': 'text',
    'attributes.size': 'text'
}, {
    weights: {
        name: 10,
        category: 8,
        shortDescription: 5,
        description: 3,
        'attributes.color': 2,
        'attributes.size': 2
    },
    name: 'product_search_index'
});

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Define static methods
productSchema.static('findNewArrivals', function(limit = 6) {
    return this.find({ status: 'published' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('category');
});

productSchema.static('findBestSellers', function(limit = 6) {
    return this.find({ status: 'published' })
        .sort({ salesCount: -1 })
        .limit(limit)
        .populate('category');
});

productSchema.static('findFeatured', function(limit = 6) {
    return this.find({ 
        status: 'published',
        featured: true 
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('category');
});

const Product = mongoose.model('Product', productSchema);

export default Product; 