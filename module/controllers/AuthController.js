const httpStatus = require("http-status");
const jwt = require("jsonwebtoken");
const Response = require("../model/Response");
const userValidator = require("../utils/UserValidator");
const logInValidator = require("../utils/LoginValidator");
const bcrypt = require("../utils/bcrypt");
const { PrismaClient } = require('@prisma/client');
const admin = require("../middleware/firebaseMiddle");
const prisma = new PrismaClient();

const signUp = async (req, res) => {
  let response = null;
  try {
    const { name, username, email, password } = await userValidator.validateAsync(req.body);

    const hashedPassword = await bcrypt.hash(password);
    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
      },
    });

    response = new Response.Success(false, "Signup Success", user);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const logIn = async (req, res) => {
  let response = null;
  const signInErrorMessage = "Invalid username or password";
  try {
    const request = await logInValidator.validateAsync(req.body);

    const user = await prisma.user.findUnique({
      where: { username: request.username },
    });
    if (!user) {
      response = new Response.Error(true, signInErrorMessage);
      res.status(httpStatus.BAD_REQUEST).json(response);
      return;
    }

    const isValidPassword = await bcrypt.compare(request.password, user.password);
    if (!isValidPassword) {
      response = new Response.Error(true, signInErrorMessage);
      res.status(httpStatus.BAD_REQUEST).json(response);
      return;
    }

    const createJwtToken = jwt.sign({ id: user.id }, process.env.KEY);

    console.log("User logged in:", user.username);
    console.log(request.fcmToken);
    // Update FCM token
    if (request.fcmToken) {
      await prisma.user.update({
        where: { id: user.id },
        data: { fcmToken: request.fcmToken },
      });
      user.fcmToken = request.fcmToken;

      // Send notification
     
    }
    if (user.fcmToken) {
       console.log("Sending notification to:", user.fcmToken);
      const message = {
        notification: {
          title: 'New Login',
          body: 'You have successfully logged in.',
        },
        token: user.fcmToken,
      };

      try {
        await admin.messaging().send(message);
        console.log('Successfully sent login notification');
      } catch (error) {
        console.error('Error sending login notification:', error);
      }
    }

    const data = { token: createJwtToken, user };
    response = new Response.Success(false, "Login Success", data);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.KEY);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true } 
    });

    if (!user) {
      return res.status(403).json({ error: "Forbidden: User not found or inactive" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error in token authentication:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: "Forbidden: Invalid token" });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bulan: true,
        kategori: true,
        asalUang: true,
        budget: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(new Response.Success(false, "Profile retrieved successfully", user));
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json(new Response.Error(true, "Internal Server Error"));
  }
};
const logout = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: null },
    });

    // You might want to invalidate the token here if you're using a token blacklist
    // For this example, we'll assume the client will discard the token

    res.json(new Response.Success(false, "Logged out successfully", null));
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new Response.Error(true, "Internal Server Error"));
  }
};

module.exports = { signUp, logIn, getUserProfile, authenticateToken, logout };