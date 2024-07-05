const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const httpStatus = require("http-status");
const Response = require("../model/Response");

let response = null;

const addBudget = async (req, res) => {
  let budget = null;
  try {
    const {
      kategoriId,
      userId,
      grupId,
      jumlahBudget,
      frekuensi,
      tanggalMulai,
      tanggalSelesai,
      pengulangan,
    } = req.body;
    const findBudget = await prisma.budget.findMany({
      where: {
        userId: parseInt(userId),
        kategoriId: parseInt(kategoriId),
        grupId: parseInt(grupId),
      },
    });
    if (findBudget.length > 0) {
      response = new Response.Error(true, "Budget already exists");
      return res.status(httpStatus.BAD_REQUEST).json(response);
    }

    const budgetData = {
      jumlahBudget: parseFloat(jumlahBudget),
      kategoriId: parseInt(kategoriId),
      userId: parseInt(userId),
      grupId: parseInt(grupId),
      frekuensi: frekuensi,
      tanggalMulai: new Date(tanggalMulai),
      pengulangan: pengulangan,
      sisaBudget: parseFloat(jumlahBudget),
    };

    if (tanggalSelesai && !isNaN(new Date(tanggalSelesai).getTime())) {
      budgetData.tanggalSelesai = new Date(tanggalSelesai);
    }

    if (new Date() >= budgetData.tanggalMulai) {
      budgetData.status = "Aktif";
    }

    if (frekuensi === "Harian") {
      budget = await prisma.budget.create({ data: budgetData });
    } else if (frekuensi === "Mingguan") {
      budget = await prisma.budget.create({ data: budgetData });
    } else if (frekuensi === "Bulanan") {
      budget = await prisma.budget.create({ data: budgetData });
    }

    response = new Response.Success(false, "Budget added successfully", budget);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      kategoriId,
      userId,
      grupId,
      jumlahBudget,
      frekuensi,
      tanggalMulai,
      tanggalSelesai,
      pengulangan,
    } = req.body;

    const budgetData = {
      jumlahBudget: parseFloat(jumlahBudget),
      kategoriId: parseInt(kategoriId),
      userId: parseInt(userId),
      grupId: parseInt(grupId),
      frekuensi: frekuensi,
      tanggalMulai: new Date(tanggalMulai),
      pengulangan: pengulangan,
      sisaBudget: parseFloat(jumlahBudget),
    };

    if (tanggalSelesai && !isNaN(new Date(tanggalSelesai).getTime())) {
      budgetData.tanggalSelesai = new Date(tanggalSelesai);
    }

    if (new Date() >= budgetData.tanggalMulai) {
      budgetData.status = "Aktif";
    }

    const budget = await prisma.budget.update({
      where: { id: parseInt(id) },
      data: budgetData,
    });

    if (!budget) {
      response = new Response.Error(true, "Budget not found");
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    response = new Response.Success(
      false,
      "Budget updated successfully",
      budget
    );
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
      response = new Response.Error(true, "Budget not found");
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    response = new Response.Success(
      false,
      "Budget deleted successfully",
      budget
    );
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    if (error.code === "P2003") {
      // This is the error code for a foreign key constraint violation in Prisma
      response = new Response.Error(
        true,
        "Cannot delete budget. It is being used by other tables."
      );
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
    const budget = await prisma.budget.findMany({
      include: {
        kategori: true,
        user: true,
        grup: true,
      },
    });
    response = new Response.Success(
      false,
      "Budget retrieved successfully",
      budget
    );
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
      include: {
        kategori: true,
        user: true,
        grup: true,
      },
    });

    response = new Response.Success(
      false,
      "Budget retrieved successfully",
      budget
    );
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
      include: {
        kategori: true,
        grup: true,
      },
    });

    response = new Response.Success(
      false,
      "Budget retrieved successfully",
      budget
    );
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const updateSisaBudget = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentDay = currentDate.getDay(); // 0 (Sunday) to 6 (Saturday)
    const currentDateOfMonth = currentDate.getDate();

    const budgets = await prisma.budget.findMany({
      where: {
        status: "Aktif",
        tanggalSelesai: {
          gte: currentDate,
        },
      },
    });

    for (const budget of budgets) {
      if (
        budget.frekuensi === "Harian" ||
        (budget.frekuensi === "Mingguan" &&
          currentDay === getDayIndex(budget.pengulangan)) ||
        (budget.frekuensi === "Bulanan" &&
          currentDateOfMonth === budget.tanggalMulai.getDate())
      ) {
        await prisma.budget.update({
          where: { id: budget.id },
          data: { sisaBudget: budget.jumlahBudget },
        });
      }
    }

    response = new Response.Success(false, "Sisa Budget updated successfully");
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

// Helper function to get the day index based on the day name
const getDayIndex = (dayName) => {
  const daysOfWeek = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];
  return daysOfWeek.indexOf(dayName);
};

const updateBudgetStatus = async (req, res) => {
  try {
    const currentDate = new Date();

    const budgets = await prisma.budget.findMany({
      where: {
        status: "Aktif",
        tanggalSelesai: {
          lte: currentDate,
        },
      },
    });
    console.log(currentDate);
    console.log(budgets);

    for (const budget of budgets) {
      await prisma.budget.update({
        where: { id: budget.id },
        data: { status: "Tidak Aktif" },
      });
    }

    response = new Response.Success(
      false,
      "Budget status updated successfully"
    );
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
  updateSisaBudget,
  updateBudgetStatus,
};
