import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Static methods
promotionSchema.statics.findAll = async function() {
    return this.find({ active: true });
};

promotionSchema.statics.findById = async function(id) {
    return this.findOne({ _id: id, active: true });
};

promotionSchema.statics.create = async function(promotionData) {
    const promotion = new this(promotionData);
    return promotion.save();
};

const Promotion = mongoose.model('Promotion', promotionSchema);

export default Promotion; 