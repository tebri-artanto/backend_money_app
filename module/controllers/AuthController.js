const httpStatus = require("http-status");
const jwt = require("jsonwebtoken");
const Response = require("../model/Response");
const userValidator = require("../utils/UserValidator");
const logInValidator = require("../utils/LoginValidator");
const bcrypt = require("../utils/bcrypt");
const { PrismaClient } = require('@prisma/client');

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
    const data = { token: createJwtToken, user };
    response = new Response.Success(false, "Login Success", data);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getUserById = async (req, res) => {
  let response = null;
try {
  const { userId } = req.params;
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid userId" });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(userId)
    },
    include: {
      bulan: true,
      kategori: true,
      asalUang: true,
      grupMember: true,
      budgetBulanan: true
    }
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  response = user;
} catch (error) {
  console.error("Error fetching user:", error);
  return res.status(500).json({ error: "Internal Server Error" });
}
res.json(response);

};

module.exports = { signUp, logIn, getUserById };