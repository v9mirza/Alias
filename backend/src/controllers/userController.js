import User from '../models/User.js';

/**
 * @desc    Get user profile by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('username bio interests isOnline lastSeen');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { bio, interests } = req.body;
    const updates = {};

    if (bio !== undefined) updates.bio = bio;
    if (interests !== undefined) updates.interests = interests;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('username bio interests isOnline lastSeen');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search users by username
 * @route   GET /api/users/search
 * @access  Private
 */
export const searchUsers = async (req, res, next) => {
  try {
    const { q = '', page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;
    const trimmedQuery = q.trim();

    const baseFilter = { _id: { $ne: req.user._id } };

    if (!trimmedQuery) {
      const users = await User.find(baseFilter).select('username bio interests isOnline lastSeen');

      const dateSeed = new Date().toISOString().slice(0, 10);
      const seedSource = `${req.user._id.toString()}-${dateSeed}`;
      let seed = 0;
      for (let i = 0; i < seedSource.length; i += 1) {
        seed = (seed * 31 + seedSource.charCodeAt(i)) >>> 0;
      }

      const nextRandom = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 2 ** 32;
      };

      const shuffled = [...users].sort(() => nextRandom() - 0.5);
      const paginatedUsers = shuffled.slice(skipNum, skipNum + limitNum);
      const total = shuffled.length;

      return res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: paginatedUsers,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum)
          }
        }
      });
    }

    // Search query: match username (case insensitive), and exclude self
    const filter = {
      ...baseFilter,
      username: { $regex: trimmedQuery, $options: 'i' }
    };

    const users = await User.find(filter)
      .select('username bio interests isOnline lastSeen')
      .skip(skipNum)
      .limit(limitNum)
      .sort({ username: 1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
