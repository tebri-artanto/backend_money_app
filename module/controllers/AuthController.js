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

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      response = new Response.Error(true, "Email already in use");
      res.status(httpStatus.CONFLICT).json(response);
      return;
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      response = new Response.Error(true, "Username already taken");
      res.status(httpStatus.CONFLICT).json(response);
      return;
    }

    const hashedPassword = await bcrypt.hash(password);
    
    const defaultKategori = [
      { namaKategori: 'Makanan', jenisKategori: 'Pengeluaran' },
      { namaKategori: 'Transportasi', jenisKategori: 'Pengeluaran' },
      { namaKategori: 'Belanja', jenisKategori: 'Pengeluaran' },
      { namaKategori: 'Hiburan', jenisKategori: 'Pengeluaran' },
      { namaKategori: 'Gaji', jenisKategori: 'Pemasukan' },
      { namaKategori: 'Bonus', jenisKategori: 'Pemasukan' },
      { namaKategori: 'Investasi', jenisKategori: 'Pemasukan' },
    ];

    const defaultAsalUang = [
      { tipeAsalUang: 'Cash' },
      { tipeAsalUang: 'Rekening' },
      { tipeAsalUang: 'Dompet Digital' },
    ];

    const user = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          name,
          username,
          email,
          password: hashedPassword,
        },
      });

      await Promise.all(defaultKategori.map(kategori => 
        prisma.kategori.create({
          data: {
            namaKategori: kategori.namaKategori,
            jenisKategori: kategori.jenisKategori,
            userId: newUser.id,
          },
        })
      ));

      await Promise.all(defaultAsalUang.map(asalUang => 
        prisma.asalUang.create({
          data: {
            ...asalUang,
            userId: newUser.id,
          },
        })
      ));

      return newUser;
    });

    response = new Response.Success(false, "Signup Success", user);
    res.status(httpStatus.CREATED).json(response);
  } catch (error) {
    console.error("Signup error:", error);
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

    if (request.fcmToken) {
      console.log("FCM Token provided:", request.fcmToken);
      await prisma.user.update({
        where: { id: user.id },
        data: { fcmToken: request.fcmToken },
      });
      user.fcmToken = request.fcmToken;

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
    } else {
      console.log("Web login - no FCM token provided");
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


    res.json(new Response.Success(false, "Logged out successfully", null));
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new Response.Error(true, "Internal Server Error"));
  }
};

const editProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, username, email } = req.body;

    // Validate input
    if (!name && !username && !email) {
      return res.status(httpStatus.BAD_REQUEST).json(new Response.Error(true, "At least one field (name, username, or email) must be provided"));
    }

    // Check if username or email already exists
    if (username) {
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(httpStatus.CONFLICT).json(new Response.Error(true, "Username already taken"));
      }
    }

    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(httpStatus.CONFLICT).json(new Response.Error(true, "Email already in use"));
      }
    }
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        username: username || undefined,
        email: email || undefined,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
      }
    });

    res.json(new Response.Success(false, "Profile updated successfully", updatedUser));
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new Response.Error(true, "Internal Server Error"));
  }
};
  const changePassword = async (req, res) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
  
      const user = await prisma.user.findUnique({ where: { id: userId } });
  
      if (!user) {
        return res.status(404).json(new Response.Error(true, "User not found"));
      }
  
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json(new Response.Error(true, "Current password is incorrect"));
      }
  
      const hashedNewPassword = await bcrypt.hash(newPassword);
  
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });
  
      res.json(new Response.Success(false, "Password changed successfully"));
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json(new Response.Error(true, "Internal Server Error"));
    }
  };

module.exports = { signUp, logIn, getUserProfile, authenticateToken, logout, editProfile, changePassword };