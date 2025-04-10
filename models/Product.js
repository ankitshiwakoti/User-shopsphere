import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    shortDescription: {
        type: String,
        required: true,
        maxLength: 150
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
    images: [{
        url: { type: String, required: true },
        alt: { type: String, required: true }
    }],
    thumbnail: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Fruits & Vegetables', 'Meat & Fish', 'Snacks', 'Beverages', 'Beauty & Health', 'Bread & Bakery']
    },
    subcategory: {
        type: String,
        required: false
    },
    badges: [{
        type: String,
        enum: ['ORGANIC', 'COLD SALE', 'NEW', 'TRENDING', 'BEST SELLER', 'FEATURED']
    }],
    tags: [{
        type: String
    }],
    attributes: {
        weight: { type: String },
        unit: { 
            type: String,
            enum: ['kg', 'g', 'lb', 'oz', 'l', 'ml', 'pieces']
        },
        packageType: { type: String },
        megaRolls: { type: Number, min: 0 }
    },
    stock: {
        quantity: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        lowStockThreshold: {
            type: Number,
            default: 10
        },
        status: {
            type: String,
            enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'],
            default: 'IN_STOCK'
        }
    },
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true },
        images: [{ type: String }],
        helpful: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now }
    }],
    nutrition: {
        servingSize: { type: String },
        calories: { type: Number },
        protein: { type: Number },
        carbohydrates: { type: Number },
        fat: { type: Number },
        fiber: { type: Number }
    },
    seo: {
        metaTitle: { type: String },
        metaDescription: { type: String },
        keywords: [{ type: String }]
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'DRAFT', 'ARCHIVED'],
        default: 'ACTIVE'
    },
    featured: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update the updatedAt timestamp
productSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Update stock status before saving
productSchema.pre('save', function(next) {
    if (this.stock.quantity <= 0) {
        this.stock.status = 'OUT_OF_STOCK';
    } else if (this.stock.quantity <= this.stock.lowStockThreshold) {
        this.stock.status = 'LOW_STOCK';
    } else {
        this.stock.status = 'IN_STOCK';
    }
    next();
});

// Static methods
productSchema.statics.findAll = async function(options = {}) {
    const query = { status: 'ACTIVE' };
    
    if (options.category) {
        query.category = options.category;
    }
    
    if (options.featured) {
        query.featured = true;
    }

    const sort = {};
    if (options.sortBy) {
        switch (options.sortBy) {
            case 'price_asc':
                sort.price = 1;
                break;
            case 'price_desc':
                sort.price = -1;
                break;
            case 'newest':
                sort.createdAt = -1;
                break;
            case 'rating':
                sort['rating.average'] = -1;
                break;
            default:
                sort.createdAt = -1;
        }
    }

    return this.find(query)
        .sort(sort)
        .skip(options.skip || 0)
        .limit(options.limit || 20);
};

productSchema.statics.findById = async function(id) {
    return this.findOne({ _id: id, status: 'ACTIVE' });
};

productSchema.statics.findBySlug = async function(slug) {
    return this.findOne({ slug, status: 'ACTIVE' });
};

productSchema.statics.findFeatured = async function(limit = 6) {
    return this.find({ 
        status: 'ACTIVE',
        featured: true 
    })
    .sort({ 'rating.average': -1 })
    .limit(limit);
};

productSchema.statics.findNewArrivals = async function(limit = 8) {
    return this.find({ status: 'ACTIVE' })
        .sort({ createdAt: -1 })
        .limit(limit);
};

productSchema.statics.findBestSellers = async function(limit = 8) {
    return this.find({ 
        status: 'ACTIVE',
        'rating.average': { $gte: 4 },
        'rating.count': { $gte: 5 }
    })
    .sort({ 'rating.count': -1 })
    .limit(limit);
};

const Product = mongoose.model('Product', productSchema);

export default Product; 