const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const httpStatus = require('http-status');
const Response = require('../model/Response');

let response = null;

const addAsalUang = async (req, res) => {
  try {
    const { tipeAsalUang, userId } = req.body;

    const existingAsalUang = await prisma.asalUang.findFirst({
      where: {
        tipeAsalUang,
        userId: parseInt(userId),
      },
    });

    if (existingAsalUang) {
      response = new Response.Error(true, 'Tipe asal uang sudah digunakan');
      return res.status(httpStatus.BAD_REQUEST).json(response);
    }

    const asalUang = await prisma.asalUang.create({
      data: {
        tipeAsalUang,
        userId: parseInt(userId),
      },
    });

    response = new Response.Success(false, 'Asal uang added successfully', asalUang);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const updateAsalUang = async (req, res) => {
  try {
    const { tipeAsalUang } = req.body;
    const { id } = req.params;

    const asalUang = await prisma.asalUang.findUnique({
      where: { id: parseInt(id) },
    });

    if (!asalUang) {
      response = new Response.Error(true, 'Asal uang not found');
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    const existingAsalUang = await prisma.asalUang.findFirst({
      where: {
        tipeAsalUang,
        userId: asalUang.userId,
        NOT: { id: parseInt(id) },
      },
    });

    if (existingAsalUang) {
      response = new Response.Error(true, 'Tipe asal uang sudah digunakan');
      return res.status(httpStatus.BAD_REQUEST).json(response);
    }

    const usedInRiwayat = await prisma.riwayat.findFirst({
      where: { asalUangId: parseInt(id) },
    });

    if (usedInRiwayat) {
      response = new Response.Error(true, 'Tidak dapat mengubah asal uang. Asal uang sedang digunakan dalam riwayat.');
      return res.status(httpStatus.BAD_REQUEST).json(response);
    }

    const updatedAsalUang = await prisma.asalUang.update({
      where: { id: parseInt(id) },
      data: { tipeAsalUang },
    });

    response = new Response.Success(false, 'Asal uang updated successfully', updatedAsalUang);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const deleteAsalUang = async (req, res) => {
  try {
    const { id } = req.params;

    const usedInRiwayat = await prisma.riwayat.findFirst({
      where: { asalUangId: parseInt(id) },
    });

    if (usedInRiwayat) {
      response = new Response.Error(true, 'Tidak dapat menghapus asal uang. Asal uang sedang digunakan dalam riwayat.');
      return res.status(httpStatus.BAD_REQUEST).json(response);
    }

    const asalUang = await prisma.asalUang.delete({
      where: { id: parseInt(id) },
    });

    response = new Response.Success(false, 'Asal uang deleted successfully', asalUang);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(response);
  }
};

const getAllAsalUang = async (req, res) => {
  try {
    const asalUang = await prisma.asalUang.findMany();
    response = new Response.Success(false, 'Asal uang retrieved successfully', asalUang);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getAsalUangById = async (req, res) => {
  try {
    const { id } = req.params;

    const asalUang = await prisma.asalUang.findUnique({
      where: { id: parseInt(id) },
    });

    response = new Response.Success(false, 'Asal uang retrieved successfully', asalUang);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getAsalUangByUserId = async (req, res) => {
  const userId = req.user.id;

  try {
    const asalUang = await prisma.asalUang.findMany({
      where: { userId },
    });

    response = new Response.Success(false, 'Asal uang retrieved successfully', asalUang);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

module.exports = {
  addAsalUang,
  updateAsalUang,
  deleteAsalUang,
  getAllAsalUang,
  getAsalUangById,
  getAsalUangByUserId,
};