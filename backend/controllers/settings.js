const Location = require('../models/Location');

// @desc    Get office settings
// @route   GET /api/settings/office
// @access  Private
exports.getOfficeSettings = async (req, res, next) => {
  try {
    // Force fresh data by disabling cache (avoids 304)
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const office = await Location.findOne({ name: 'Office Main' }) || await Location.findOne();
    res.status(200).json({
      success: true,
      data: office || null,
    });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update office settings
// @route   PUT /api/settings/office
// @access  Private/Admin
exports.updateOfficeSettings = async (req, res, next) => {
  try {
    let office = await Location.findOneAndUpdate(
      { name: 'Office Main' },
      req.body,
      { returnDocument: 'after', runValidators: true, upsert: true }
    );
    res.status(200).json({
      success: true,
      data: office,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
