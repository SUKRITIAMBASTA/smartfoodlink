const mongoose = require('mongoose');

const foodListingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Food title is required'],
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    quantity: {
        type: String,
        required: [true, 'Quantity is required'],
        trim: true                          
    },
    category: {
        type: String,
        enum: ['cooked', 'raw', 'packaged', 'beverages', 'other'],
        default: 'cooked'
    },
    expiresAt: {
        type: Date,
        required: [true, 'Expiry time is required']
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],                   // [lng, lat]
            required: true
        }
    },
    address: {
        type: String,
        trim: true
    },
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    status: {
        type: String,
        enum: ['available', 'claimed', 'picked_up', 'delivered', 'expired'],
        default: 'available'
    },
    contactPhone: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Geospatial index for "near me" queries
foodListingSchema.index({ location: '2dsphere' });

// Auto-expire: mark as expired after expiresAt
foodListingSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('FoodListing', foodListingSchema);
