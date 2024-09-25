const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const httpStatus = require('http-status');
const Response = require('../model/Response');

let response = null;

const addKategori = async (req, res) => {
  try {
    const { namaKategori, userId, jenisKategori } = req.body;

    const kategori = await prisma.kategori.create({
      data: {
        namaKategori,
        userId: parseInt(userId),
        jenisKategori,
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
    console.log(`Deleting kategori with id: ${id}`);

    // Check if the kategori is used in any riwayat or budget
    const usedInRiwayat = await prisma.riwayat.findFirst({
      where: { kategoriId: parseInt(id) },
    });
    console.log(`Used in riwayat: ${usedInRiwayat ? 'Yes' : 'No'}`);

    const usedInBudget = await prisma.budget.findFirst({
      where: { kategoriId: parseInt(id) },
    });
    console.log(`Used in budget: ${usedInBudget ? 'Yes' : 'No'}`);

    if (usedInRiwayat || usedInBudget) {
      response = new Response.Error(true, 'Tidak dapat menghapus kategori. Kategori sedang digunakan dalam riwayat atau anggaran.');
      console.log('Kategori is in use, cannot delete.');
      return res.status(httpStatus.BAD_REQUEST).json(response);
    }

    const kategori = await prisma.kategori.delete({
      where: { id: parseInt(id) },
    });
    console.log(`Kategori deleted: ${kategori ? 'Yes' : 'No'}`);

    if (!kategori) {
      response = new Response.Error(true, 'Kategori not found');
      console.log('Kategori not found.');
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    response = new Response.Success(false, 'Kategori deleted successfully', kategori);
    console.log('Kategori deleted successfully.');
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error('Error deleting kategori:', error);
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
  const jenisKategori = req.query.jenisKategori;

  try {
    let kategoriQuery = {
      where: { userId: userId }
    };

    if (jenisKategori) {
      kategoriQuery.where.jenisKategori = jenisKategori;
    }

    const kategori = await prisma.kategori.findMany(kategoriQuery);

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