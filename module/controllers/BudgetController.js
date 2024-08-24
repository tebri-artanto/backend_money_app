const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const httpStatus = require("http-status");
const Response = require("../model/Response");

let response = null;
const addBudget = async (req, res) => {
  try {
    console.log("masuk add budget");
    console.log(req.body);
    const {
      kategoriId,
      userId,
      grupId,
      jumlahBudget,
      frekuensi,
      tanggalMulai,
      tanggalSelesai,
    } = req.body;

    const startDate = new Date(tanggalMulai);
    const endDate = tanggalSelesai ? new Date(tanggalSelesai) : null;

    const findBudget = await prisma.budget.findMany({
      where: {
        userId: parseInt(userId),
        kategoriId: parseInt(kategoriId),
        grupId: parseInt(grupId),
        detailBudget: {
          some: {
            OR: [
              {
                AND: [
                  { tanggalMulai: { lte: startDate } },
                  { tanggalSelesai: { gte: startDate } },
                ],
              },
              {
                AND: [
                  { tanggalMulai: { lte: endDate } },
                  { tanggalSelesai: { gte: endDate } },
                ],
              },
              {
                AND: [
                  { tanggalMulai: { gte: startDate } },
                  { tanggalSelesai: { lte: endDate } },
                ],
              },
            ],
          },
        },
      },
    });

    if (findBudget.length > 0) {
      response = new Response.Error(true, "Budget already exists for the given date range");
      return res.status(httpStatus.BAD_REQUEST).json(response);
    }

    const budgetData = {
      jumlahBudget: parseFloat(jumlahBudget),
      kategoriId: parseInt(kategoriId),
      userId: parseInt(userId),
      grupId: parseInt(grupId),
      frekuensi: frekuensi,
      status: "Aktif",
    };

    const budget = await prisma.budget.create({ data: budgetData });

    const detailBudgets = [];

    let currentDate = new Date(startDate);
    let iteration = 1;

    while (!endDate || currentDate <= endDate) {
      const nextDate = getNextDate(currentDate, frekuensi);
      
      const detailBudgetData = {
        budgetId: budget.id,
        sisaBudget: parseFloat(jumlahBudget),
        terpakai: 0,
        tanggalMulai: currentDate,
        tanggalSelesai: nextDate,
        pengulangan: iteration,
      };

      detailBudgets.push(detailBudgetData);

      currentDate = nextDate;
      iteration++;

      if (!endDate && iteration > 1) break; 
    }

    await prisma.detailBudget.createMany({
      data: detailBudgets,
    });

    response = new Response.Success(false, "Budget added successfully", budget);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};
function getNextDate(currentDate, frekuensi) {
  const nextDate = new Date(currentDate);
  switch (frekuensi) {
    case "Harian":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "Mingguan":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "Bulanan":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    default:
      throw new Error("Invalid frequency");
  }
  return nextDate;
}


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

    // Find the budget by id
    const budget = await prisma.budget.findUnique({
      where: { id: parseInt(id) },
      include: {
        detailBudget: true,
      },
    });

    if (!budget) {
      response = new Response.Error(true, "Budget not found");
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    // Get the detail budget ids associated with the budget
    const detailBudgetIds = budget.detailBudget.map((detail) => detail.id);

    // Update riwayat records to remove references to the detail budgets
    await prisma.riwayat.updateMany({
      where: {
        detailBudgetId: {
          in: detailBudgetIds,
        },
      },
      data: {
        detailBudgetId: null,
      },
    });

    // Delete the associated detail budgets
    await prisma.detailBudget.deleteMany({
      where: {
        budgetId: budget.id,
      },
    });

    // Delete the budget
    await prisma.budget.delete({
      where: { id: budget.id },
    });
    console.log(budget);
    console.log("masuk delete budget");
    response = new Response.Success(
      false,
      "Budget and associated data deleted successfully",
      budget
    );
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getAllBudget = async (req, res) => {
  try {
    const budget = await prisma.budget.findMany({
      include: {
        kategori: true,
        user: true,
        grup: true,
        detailBudget: true,
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
        detailBudget: true,
      },
    });

    if (!budget) {
      const response = new Response.Error(true, "Budget not found");
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    const response = new Response.Success(
      false,
      "Budget retrieved successfully",
      budget
    );
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    const response = new Response.Error(true, error.message);
    console.error(error);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getBudgetByUserId = async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: {
        kategori: true,
        detailBudget: {
          orderBy: {
            tanggalMulai: 'asc'
          }
        },
      },
    });

    const processedBudgets = budgets.map(budget => {
      let firstDate = null;
      let lastDate = null;

      if (budget.detailBudget.length > 0) {
        firstDate = budget.detailBudget[0].tanggalMulai;
        lastDate = budget.detailBudget[budget.detailBudget.length - 1].tanggalSelesai;
      }

      return {
        ...budget,
        firstDate,
        lastDate,
      };
    });

    if (processedBudgets.length === 0) {
      const response = new Response.Error(true, "User does not have any budget");
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    response = new Response.Success(
      false,
      "Budget retrieved successfully",
      processedBudgets
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
