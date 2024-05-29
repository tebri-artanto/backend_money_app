const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const httpStatus = require('http-status');
const Response = require('../model/Response');

let response = null;

const addKategori = async (req, res) => {
  try {
    const { namaKategori, userId, grupId } = req.body;

    const kategori = await prisma.kategori.create({
      data: {
        namaKategori,
        userId: parseInt(userId),
        grupId: parseInt(grupId),
      },
    });

    response = new Response.Success(false, 'Kategori added successfully', kategori);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const updateKategori = async (req, res) => {
  try {
    const { namaKategori } = req.body;
    const { id } = req.params;

    const kategori = await prisma.kategori.update({
      where: { id: parseInt(id) },
      data: { namaKategori },
    });

    if (!kategori) {
      response = new Response.Error(true, 'Kategori not found');
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    response = new Response.Success(false, 'Kategori updated successfully', kategori);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const deleteKategori = async (req, res) => {
  try {
    const { id } = req.params;

    const kategori = await prisma.kategori.delete({
      where: { id: parseInt(id) },
    });

    if (!kategori) {
      response = new Response.Error(true, 'Kategori not found');
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    response = new Response.Success(false, 'Kategori deleted successfully', kategori);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getAllKategori = async (req, res) => {
  try {
    const kategori = await prisma.kategori.findMany();
    response = new Response.Success(false, 'Kategori retrieved successfully', kategori);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getKategoriById = async (req, res) => {
  try {
    const { id } = req.params;

    const kategori = await prisma.kategori.findUnique({
      where: { id: parseInt(id) },
    });

    response = new Response.Success(false, 'Kategori retrieved successfully', kategori);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getKategoriByUserId = async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const kategori = await prisma.kategori.findMany({
      where: { userId },
    });

    response = new Response.Success(false, 'Kategori retrieved successfully', kategori);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

module.exports = {
  addKategori,
  updateKategori,
  deleteKategori,
  getAllKategori,
  getKategoriById,
  getKategoriByUserId,
};