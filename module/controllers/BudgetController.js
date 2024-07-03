const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const httpStatus = require('http-status');
const Response = require('../model/Response');

let response = null;

const addBudget = async (req, res) => {
  try {
    const { kategoriId, userId, grupId, jumlahBudget, bulanId } = req.body;

    const findBudget = await prisma.budgetBulanan.findFirst({
        where: {
            kategoriId: parseInt(kategoriId),
            bulanId: parseInt(bulanId),
        },
    });

    if (findBudget) {
        response = new Response.Error(true, 'Budget already exists');
        return res.status(httpStatus.BAD_REQUEST).json(response);
    }

    const budget = await prisma.budgetBulanan.create({
      data: {
        jumlahBudget: parseFloat(jumlahBudget),
        kategoriId: parseInt(kategoriId),
        userId: parseInt(userId),
        grupId: parseInt(grupId),
        bulanId: parseInt(bulanId),
      },
    });

    response = new Response.Success(false, 'Budget added successfully', budget);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const updateBudget = async (req, res) => {
  try {
    const { budgetId } = req.body;
    const { id } = req.params;

    const budget = await prisma.budget.update({
      where: { id: parseInt(id) },
      data: { budgetId },
    });

    if (!budget) {
      response = new Response.Error(true, 'Budget not found');
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    response = new Response.Success(false, 'Budget updated successfully', budget);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await prisma.budget.delete({
      where: { id: parseInt(id) },
    });

    if (!budget) {
      response = new Response.Error(true, 'Budget not found');
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    response = new Response.Success(false, 'Budget deleted successfully', budget);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    if (error.code === 'P2003') {
      // This is the error code for a foreign key constraint violation in Prisma
      response = new Response.Error(true, 'Cannot delete budget. It is being used by other tables.');
      res.status(httpStatus.BAD_REQUEST).json(response);
    } else {
      response = new Response.Error(true, error.message);
      console.error(error);
      res.status(httpStatus.BAD_REQUEST).json(response);
    }
  }
};

const getAllBudget = async (req, res) => {
  try {
    const budget = await prisma.budget.findMany();
    response = new Response.Success(false, 'Budget retrieved successfully', budget);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getBudgetById = async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await prisma.budget.findUnique({
      where: { id: parseInt(id) },
    });

    response = new Response.Success(false, 'Budget retrieved successfully', budget);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getBudgetByUserId = async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const budget = await prisma.budget.findMany({
      where: { userId },
    });

    response = new Response.Success(false, 'Budget retrieved successfully', budget);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

module.exports = {
  addBudget,
  updateBudget,
  deleteBudget,
  getAllBudget,
  getBudgetById,
  getBudgetByUserId,
};