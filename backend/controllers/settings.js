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
    
    let office = await Location.findOne({ name: 'Office Main' });
    if (!office) {
      // Try to find any location if 'Office Main' doesn't exist
      office = await Location.findOne();
    }
    if (!office) {
      // Create default if still not exists
      office = await Location.create({
        name: 'Office Main',
        latitude: 16.7050,
        longitude: 74.2433,
        radius: 200,
      });
    }
    res.status(200).json({
      success: true,
      data: office,
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
    console.log('Updating settings with data:', req.body);
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
