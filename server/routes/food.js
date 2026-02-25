const express = require('express');
const FoodListing = require('../models/FoodListing');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/food — Create listing (donor only) ──────────
router.post('/', protect, authorize('donor', 'admin'), async (req, res) => {
    try {
        const { title, description, quantity, category, expiresAt, latitude, longitude, address, contactPhone } = req.body;

        const listing = await FoodListing.create({
            title,
            description,
            quantity,
            category,
            expiresAt,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0]
            },
            address,
            donor: req.user._id,
            contactPhone
        });

        res.status(201).json(listing);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/food — List available food ────────────────────
router.get('/', async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
        let query = { status: 'available', expiresAt: { $gt: new Date() } };

        // Geo query if coords provided (radius in km, default 50)
        if (lat && lng) {
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: (parseFloat(radius) || 50) * 1000  // km → m
                }
            };
        }

        const listings = await FoodListing.find(query)
            .populate('donor', 'name email phone organization')
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(listings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/food/my — Listings for current user ──────────
router.get('/my', protect, async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === 'donor') {
            filter.donor = req.user._id;
        } else if (req.user.role === 'ngo') {
            filter.claimedBy = req.user._id;
        }

        const listings = await FoodListing.find(filter)
            .populate('donor', 'name email')
            .populate('claimedBy', 'name email organization')
            .sort({ createdAt: -1 });

        res.json(listings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── PATCH /api/food/:id/claim — Claim a listing (NGO) ────
router.patch('/:id/claim', protect, authorize('ngo'), async (req, res) => {
    try {
        const listing = await FoodListing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        if (listing.status !== 'available') {
            return res.status(400).json({ message: 'Listing is no longer available' });
        }

        listing.claimedBy = req.user._id;
        listing.status = 'claimed';
        await listing.save();

        res.json(listing);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── PATCH /api/food/:id/status — Update status ────────────
router.patch('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;
        const listing = await FoodListing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Only donor owner, claiming NGO, or admin can update
        const isDonor = listing.donor.toString() === req.user._id.toString();
        const isClaimer = listing.claimedBy && listing.claimedBy.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isDonor && !isClaimer && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to update this listing' });
        }

        listing.status = status;
        await listing.save();

        res.json(listing);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── DELETE /api/food/:id — Delete listing ──────────────────
router.delete('/:id', protect, async (req, res) => {
    try {
        const listing = await FoodListing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        const isDonor = listing.donor.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isDonor && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await listing.deleteOne();
        res.json({ message: 'Listing removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
