const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const Response = require("../model/Response");
const httpStatus = require("http-status");

let response = null;

const addGrup = async (req, res) => {
  try {
    const { namaGrup, userId } = req.body;

    const grupCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()
      .substring(0, 6);
    const grup = await prisma.grup.create({
      data: {
        namaGrup,
        grupCode,
        userCreate: {
          connect: {
            id: parseInt(userId),
          },
        },
      },
    });

    const grupMember = await prisma.grupMember.create({
      data: {
        dateJoin: new Date(),
        user: {
          connect: {
            id: parseInt(userId),
          },
        },
        grup: {
          connect: {
            id: grup.id,
          },
        },
      },
    });
    console.log(grupMember);
    response = new Response.Success(false, "Grup added successfully", grup);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};
const addUserToGrup = async (req, res) => {
  try {
    const { userId, grupCode } = req.body;

    const findGrup = await prisma.grup.findFirst({
      where: { grupCode },
    });
    console.log(findGrup);
    if (!findGrup) {
      response = new Response.Error(true, "Grup not found");
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    const grupMember = await prisma.grupMember.create({
      data: {
        dateJoin: new Date(),
        user: {
          connect: {
            id: parseInt(userId),
          },
        },
        grup: {
          connect: {
            id: parseInt(findGrup.id),
          },
        },
      },
    });

    response = new Response.Success(
      false,
      "User added to grup successfully",
      grupMember
    );
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};
const updateGrup = async (req, res) => {
  try {
    const { namaGrup } = req.body;
    const { id } = req.params;

    const grup = await prisma.grup.update({
      where: { id: Number(id) },
      data: { namaGrup },
    });

    response = new Response.Success(false, "Grup updated successfully", grup);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const deleteGrup = async (req, res) => {
  try {
    const { id } = req.params;

    const grup = await prisma.grup.delete({
      where: { id: Number(id) },
    });

    response = new Response.Success(false, "Grup deleted successfully", grup);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getAllGrup = async (req, res) => {
  try {
    const grup = await prisma.grup.findMany();
    response = new Response.Success(false, "Grup retrieved successfully", grup);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getGrupById = async (req, res) => {
  try {
    const { id } = req.params;

    const grup = await prisma.grup.findUnique({
      where: { id: Number(id) },
      include: {
        bulan: true,
        grupMember: true,
        budgetBulanan: true,
        kategori: true,
        asalUang: true,
      },
    });

    if (!grup) {
      response = new Response.Error(true, "Grup not found");
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    response = new Response.Success(false, "Grup retrieved successfully", grup);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

module.exports = {
  addGrup,
  updateGrup,
  deleteGrup,
  getAllGrup,
  getGrupById,
  addUserToGrup,
};
