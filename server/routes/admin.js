const express = require('express');
const User = require('../models/User');
const FoodListing = require('../models/FoodListing');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

// ─── GET /api/admin/stats — Dashboard stats ────────────────
router.get('/stats', async (req, res) => {
    try {
        const [totalDonors, totalNGOs, totalListings, activeListings, claimedListings, deliveredListings] = await Promise.all([
            User.countDocuments({ role: 'donor' }),
            User.countDocuments({ role: 'ngo' }),
            FoodListing.countDocuments(),
            FoodListing.countDocuments({ status: 'available' }),
            FoodListing.countDocuments({ status: 'claimed' }),
            FoodListing.countDocuments({ status: 'delivered' })
        ]);

        res.json({
            totalDonors,
            totalNGOs,
            totalListings,
            activeListings,
            claimedListings,
            deliveredListings,
            totalUsers: totalDonors + totalNGOs
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/admin/users — List all users ──────────────────
router.get('/users', async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── DELETE /api/admin/users/:id — Remove a user ────────────
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /api/admin/listings — All listings ─────────────────
router.get('/listings', async (req, res) => {
    try {
        const listings = await FoodListing.find()
            .populate('donor', 'name email')
            .populate('claimedBy', 'name email organization')
            .sort({ createdAt: -1 });
        res.json(listings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
