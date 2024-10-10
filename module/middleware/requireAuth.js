const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");

const Response = require("../model/Response");
const clearToken = require("../utils/clearToken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Tidak ada token yang disediakan" });
    }

    const decoded = jwt.verify(token, process.env.KEY);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true },
    });

    if (!user) {
      return res
        .status(403)
        .json({ error: "Pengguna tidak ditemukan atau tidak aktif" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error dalam otentikasi token:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: "Token tidak valid" });
    }
    return res.status(500).json({ error: "Kesalahan Server Internal" });
  }
};

module.exports = requireAuth;