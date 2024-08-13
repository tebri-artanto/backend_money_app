const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const httpStatus = require("http-status");
const Response = require("../model/Response");

let response = null;

const getAllBulan = async (req, res) => {
  try {
    const bulan = await prisma.bulan.findMany();
    response = new Response.Success(
      false,
      "Bulan retrieved successfully",
      bulan
    );
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getBulanById = async (req, res) => {
  try {
    const { id } = req.params;

    const bulan = await prisma.bulan.findUnique({
      where: { id: parseInt(id) },
    });

    response = new Response.Success(
      false,
      "Bulan retrieved successfully",
      bulan
    );
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getBulanByTodayBulan = async (req, res) => {
  try {
    const today = new Date();
    const bulan = await prisma.bulan.findFirst({
      where: {
        bln: (today.getMonth() + 1).toString(),
      },
    });

    if (!bulan) {
      response = new Response.Error(true, "Bulan not found");
      res.status(httpStatus.NOT_FOUND).json(response);
    } else {
      response = new Response.Success(
        false,
        "Bulan retrieved successfully",
        bulan
      );
      res.status(httpStatus.OK).json(response);
    }
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

module.exports = {
  getAllBulan,
  getBulanById,
  getBulanByTodayBulan,
};
