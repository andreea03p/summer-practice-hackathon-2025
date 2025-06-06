const User = require('../models/userModel');
const { hashPassword, comparePassword } = require('../helpers/auth');
const jwt = require('jsonwebtoken');

const test = (req, res) => {
  res.json('test is working');
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email) {
      return res.json({ error: 'email is required' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.json({
        error: 'new password is required and must be at least 6 characters long',
      });
    }
    if (newPassword !== confirmPassword) {
      return res.json({ error: 'passwords do not match' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ error: 'user not found' });
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'password reset successful' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password, adminKey } = req.body;

    if (!email || !password) {
      return res.json({ error: 'email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ error: 'no user found with this email' });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.json({ error: 'passwords do not match' });
    }

    if (adminKey) {
      if (user.role !== 'admin') {
        return res.json({ error: 'not an admin account' });
      }
      if (adminKey !== process.env.ADMIN_KEY) {
        return res.json({ error: 'invalid admin key' });
      }
    }

    const payload = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    jwt.sign(payload, process.env.JWT_SECRET, {}, (err, token) => {
      if (err) {
        console.error('JWT sign error:', err);
        return res.status(500).json({ error: 'Token signing failed' });
      }

      const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      };

      res
        .cookie('token', token, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
        .json(userResponse);
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'An error occurred during login' });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, adminKey } = req.body;

    if (!name) {
      return res.json({ error: 'name is required' });
    }
    if (!email) {
      return res.json({ error: 'email is required' });
    }
    if (!password || password.length < 6) {
      return res.json({
        error: 'password is required and must be at least 6 characters long',
      });
    }
    if (!confirmPassword || password !== confirmPassword) {
      return res.json({
        error: 'password confirmation is required and must match the password',
      });
    }

    const exist = await User.findOne({ email });
    if (exist) {
      return res.json({ error: 'there is already an account with this email' });
    }

    let role = 'user';
    if (adminKey) {
      if (adminKey === process.env.ADMIN_KEY) {
        role = 'admin';
      } else {
        return res.json({ error: 'invalid admin key' });
      }
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };

    return res.json(userResponse);
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'An error occurred during registration' });
  }
};

const logoutUser = async (req, res) => {
  try {
    // Clear the auth cookie
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Error during logout' });
  }
};

module.exports = {
  test,
  registerUser,
  loginUser,
  resetPassword,
  logoutUser
};
