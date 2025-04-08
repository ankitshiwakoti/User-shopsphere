import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
    title: {
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
        maxLength: 100
    },
    type: {
        type: String,
        required: true,
        enum: ['BANNER', 'POPUP', 'CATEGORY', 'PRODUCT', 'COLLECTION']
    },
    images: {
        desktop: {
            url: { type: String, required: true },
            alt: { type: String, required: true }
        },
        mobile: {
            url: { type: String, required: true },
            alt: { type: String, required: true }
        }
    },
    discount: {
        type: {
            type: String,
            enum: ['PERCENTAGE', 'FIXED', 'BUY_X_GET_Y'],
            required: true
        },
        value: {
            type: Number,
            required: true,
            min: 0
        },
        maxDiscount: {
            type: Number,
            min: 0
        }
    },
    conditions: {
        minPurchase: {
            type: Number,
            min: 0
        },
        maxUses: {
            type: Number,
            min: 0
        },
        usesCount: {
            type: Number,
            default: 0
        },
        categories: [{
            type: String,
            enum: ['Fruits & Vegetables', 'Meat & Fish', 'Snacks', 'Beverages', 'Beauty & Health', 'Bread & Bakery']
        }],
        products: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        }]
    },
    schedule: {
        startDate: {
            type: Date,
            required: true,
            default: Date.now
        },
        endDate: {
            type: Date,
            required: true
        },
        displayStartDate: {
            type: Date
        },
        displayEndDate: {
            type: Date
        }
    },
    targeting: {
        userGroups: [{
            type: String,
            enum: ['ALL', 'NEW_USERS', 'RETURNING_USERS', 'VIP']
        }],
        devices: [{
            type: String,
            enum: ['ALL', 'DESKTOP', 'MOBILE', 'TABLET']
        }],
        locations: [String]
    },
    action: {
        type: {
            type: String,
            enum: ['LINK', 'CATEGORY', 'PRODUCT', 'COLLECTION'],
            required: true
        },
        value: {
            type: String,
            required: true
        },
        buttonText: {
            type: String,
            default: 'Shop Now'
        }
    },
    analytics: {
        views: {
            type: Number,
            default: 0
        },
        clicks: {
            type: Number,
            default: 0
        },
        conversions: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'ENDED'],
        default: 'DRAFT'
    },
    priority: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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
promotionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Update status based on dates
promotionSchema.pre('save', function(next) {
    const now = new Date();
    if (this.schedule.startDate > now) {
        this.status = 'SCHEDULED';
    } else if (this.schedule.endDate < now) {
        this.status = 'ENDED';
    } else if (this.status !== 'PAUSED' && this.status !== 'DRAFT') {
        this.status = 'ACTIVE';
    }
    next();
});

// Static methods
promotionSchema.statics.findActive = async function() {
    const now = new Date();
    return this.find({
        status: 'ACTIVE',
        'schedule.startDate': { $lte: now },
        'schedule.endDate': { $gte: now }
    }).sort({ priority: -1 });
};

promotionSchema.statics.findById = async function(id) {
    return this.findOne({ _id: id }).populate('conditions.products');
};

promotionSchema.statics.findByType = async function(type, limit = 10) {
    const now = new Date();
    return this.find({
        type,
        status: 'ACTIVE',
        'schedule.startDate': { $lte: now },
        'schedule.endDate': { $gte: now }
    })
    .sort({ priority: -1 })
    .limit(limit);
};

promotionSchema.statics.findFeatured = async function(limit = 3) {
    const now = new Date();
    return this.find({
        status: 'ACTIVE',
        'schedule.startDate': { $lte: now },
        'schedule.endDate': { $gte: now }
    })
    .sort({ priority: -1, 'analytics.conversions': -1 })
    .limit(limit);
};

const Promotion = mongoose.model('Promotion', promotionSchema);

export default Promotion; 