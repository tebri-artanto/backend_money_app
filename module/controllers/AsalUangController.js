const Response = require('../model/Response')
const httpStatus = require('http-status')
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AsalUang = require('../model/asalUang')
const User = require('../model/user')
// const validateAsalUang = require('../utils/AsalUangValidator')
let response = null

const addAsalUang = async (req, res) => {
  try {
    const { tipeAsalUang, userId, grupId } = req.body;

    const asalUang = await prisma.asalUang.create({
      data: {
        tipeAsalUang,
        userId: parseInt(userId),
        grupId: parseInt(grupId),
      },
    });

    response = new Response.Success(false, 'AsalUang added successfully', asalUang);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};


const updateAsalUang = async (req, res) => {
  try {
    const { tipeAsalUang } = req.body;
    const { id } = req.params;

    const asalUang = await prisma.asalUang.update({
      where: { id: Number(id) },
      data: { tipeAsalUang },
    });

    response = new Response.Success(false, 'AsalUang updated successfully', asalUang);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const deleteAsalUang = async (req, res) => {
  try {
    const { id } = req.params;

    const asalUang = await prisma.asalUang.delete({
      where: { id },
    });

    response = new Response.Success(false, 'AsalUang deleted successfully', asalUang);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getAllAsalUang = async (req, res) => {
  try {
    const asalUang = await prisma.asalUang.findMany();
    response = new Response.Success(false, 'AsalUang retrieved successfully', asalUang)
    res.status(httpStatus.OK).json(response)
  } catch (error) {
    response = new Response.Error(true, error.message)
    console.error(error)
    res.status(httpStatus.BAD_REQUEST).json(response)
  }
}

const getAsalUangById = async (req, res) => {
  try {
    const { id } = req.params;

    const asalUang = await prisma.asalUang.findUnique({
      where: { id: parseInt(id) },
    });
    response = new Response.Success(false, 'AsalUang retrieved successfully', asalUang)
    res.status(httpStatus.OK).json(response)
  } catch (error) {
    response = new Response.Error(true, error.message)
    console.error(error)
    res.status(httpStatus.BAD_REQUEST).json(response)
  }
}

const getAsalUangByUserId = async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const asalUang = await prisma.asalUang.findMany({
      where: { userId },
    });
    response = new Response.Success(false, 'AsalUang retrieved successfully', asalUang)
    res.status(httpStatus.OK).json(response)
  } catch (error) {
    response = new Response.Error(true, error.message)
    console.error(error)
    res.status(httpStatus.BAD_REQUEST).json(response)
  }
}


module.exports = {
  addAsalUang,
  updateAsalUang,
  deleteAsalUang,
  getAllAsalUang,
  getAsalUangById,
  getAsalUangByUserId
}
