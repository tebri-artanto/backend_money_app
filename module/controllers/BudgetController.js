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
      console.log("budget already exists");
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

      // Check if there are any riwayat with the same kategori within the budget date range
      const riwayatPengeluaran = await prisma.riwayat.findMany({
        where: {
          tanggal: {
            gte: currentDate,
            lt: nextDate,
          },
          kategoriId: parseInt(kategoriId),
          tipe: "Pengeluaran",
        },
      });

      const totalPengeluaran = riwayatPengeluaran.reduce((total, riwayat) => total + riwayat.nominal, 0);

      const detailBudgetData = {
        budgetId: budget.id,
        sisaBudget: parseFloat(jumlahBudget) - totalPengeluaran,
        terpakai: totalPengeluaran,
        tanggalMulai: currentDate,
        tanggalSelesai: nextDate,
        pengulangan: iteration,
      };

      const detailBudget = await prisma.detailBudget.create({ data: detailBudgetData });

      // Update detailBudgetId in the related riwayat
      await prisma.riwayat.updateMany({
        where: {
          id: {
            in: riwayatPengeluaran.map((riwayat) => riwayat.id),
          },
        },
        data: {
          detailBudgetId: detailBudget.id,
        },
      });

      detailBudgets.push(detailBudget);

      currentDate = nextDate;
      iteration++;

      if (!endDate && iteration > 1) break;
    }

    console.log("berhasil add budget");
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
}const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { kategoriId, jumlahBudget, frekuensi, tanggalMulai, tanggalSelesai } = req.body;

    // Fetch the existing budget
    const existingBudget = await prisma.budget.findUnique({
      where: { id: parseInt(id) },
      include: { detailBudget: true },
    });

    if (!existingBudget) {
      response = new Response.Error(true, "Budget not found");
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    // Check for overlapping date ranges
    const overlappingBudgets = await prisma.budget.findMany({
      where: {
        id: { not: parseInt(id) },
        userId: existingBudget.userId,
        kategoriId: parseInt(kategoriId),
        grupId: existingBudget.grupId,
        detailBudget: {
          some: {
            OR: [
              {
                AND: [
                  { tanggalMulai: { lte: new Date(tanggalMulai) } },
                  { tanggalSelesai: { gte: new Date(tanggalMulai) } },
                ],
              },
              {
                AND: [
                  { tanggalMulai: { lte: new Date(tanggalSelesai) } },
                  { tanggalSelesai: { gte: new Date(tanggalSelesai) } },
                ],
              },
              {
                AND: [
                  { tanggalMulai: { gte: new Date(tanggalMulai) } },
                  { tanggalSelesai: { lte: new Date(tanggalSelesai) } },
                ],
              },
            ],
          },
        },
      },
    });

    if (overlappingBudgets.length > 0) {
      response = new Response.Error(true, "Budget already exists for the given date range");
      return res.status(httpStatus.BAD_REQUEST).json(response);
    }

    // Update the main budget
    const updatedBudget = await prisma.budget.update({
      where: { id: parseInt(id) },
      data: {
        kategoriId: parseInt(kategoriId),
        jumlahBudget: parseFloat(jumlahBudget),
        frekuensi: frekuensi,
      },
    });

    // Delete the existing detail budgets
    await prisma.detailBudget.deleteMany({
      where: { budgetId: parseInt(id) },
    });

    // Create new detail budgets based on the updated date range
    let currentDate = new Date(tanggalMulai);
    const endDate = tanggalSelesai ? new Date(tanggalSelesai) : null;
    let iteration = 1;

    while (!endDate || currentDate <= endDate) {
      const nextDate = getNextDate(currentDate, frekuensi);

      const riwayatPengeluaran = await prisma.riwayat.findMany({
        where: {
          tanggal: {
            gte: currentDate,
            lt: nextDate,
          },
          kategoriId: parseInt(kategoriId),
          tipe: "Pengeluaran",
        },
      });

      const totalPengeluaran = riwayatPengeluaran.reduce((total, riwayat) => total + riwayat.nominal, 0);

      const detailBudgetData = {
        budgetId: updatedBudget.id,
        sisaBudget: parseFloat(jumlahBudget) - totalPengeluaran,
        terpakai: totalPengeluaran,
        tanggalMulai: currentDate,
        tanggalSelesai: nextDate,
        pengulangan: iteration,
      };

      const detailBudget = await prisma.detailBudget.create({ data: detailBudgetData });

      await prisma.riwayat.updateMany({
        where: {
          id: {
            in: riwayatPengeluaran.map((riwayat) => riwayat.id),
          },
        },
        data: {
          detailBudgetId: detailBudget.id,
        },
      });

      currentDate = nextDate;
      iteration++;

      if (!endDate && iteration > 1) break;
    }

    // Update riwayat records that were previously associated with the budget
    // Update riwayat records that were previously associated with the budget
await prisma.riwayat.updateMany({
  where: {
    kategoriId: parseInt(kategoriId),
    tanggal: {
      gte: new Date(tanggalMulai),
      lte: endDate || new Date(tanggalSelesai),
    },
    detailBudgetId: null,
  },
  data: {
    detailBudgetId: await prisma.detailBudget.findFirst({
      where: {
        budgetId: updatedBudget.id,
        tanggalMulai: { lte: new Date(tanggalMulai) },
        tanggalSelesai: { gte: endDate || new Date(tanggalSelesai) },
      },
      select: { id: true },
    }).then(detail => detail ? detail.id : undefined),
  },
});

// Update riwayat records that were previously associated with other budgets
await prisma.riwayat.updateMany({
  where: {
    kategoriId: parseInt(kategoriId),
    tanggal: {
      gte: new Date(tanggalMulai),
      lte: endDate || new Date(tanggalSelesai),
    },
    detailBudgetId: {
      not: null,
    },
  },
  data: {
    detailBudgetId: await prisma.detailBudget.findFirst({
      where: {
        budgetId: updatedBudget.id,
        tanggalMulai: { lte: new Date(tanggalMulai) },
        tanggalSelesai: { gte: endDate || new Date(tanggalSelesai) },
      },
      select: { id: true },
    }).then(detail => detail ? detail.id : undefined),
  },
});

    // Fetch the updated budget with its detail budgets
    const finalBudget = await prisma.budget.findUnique({
      where: { id: parseInt(id) },
      include: {
        detailBudget: true,
        kategori: true,
      },
    });

    response = new Response.Success(
      false,
      "Budget and related detail budgets updated successfully",
      finalBudget
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
  const today = new Date();

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
      let activeDetailBudget = null;

      if (budget.detailBudget.length > 0) {
        firstDate = budget.detailBudget[0].tanggalMulai;
        lastDate = budget.detailBudget[budget.detailBudget.length - 1].tanggalSelesai;
        activeDetailBudget = budget.detailBudget.find(detail => 
          new Date(detail.tanggalMulai) <= today && new Date(detail.tanggalSelesai) >= today
        );
      }

      return {
        ...budget,
        firstDate,
        lastDate,
        activeDetailBudget,
        isActive: !!activeDetailBudget
      };
    });

    // Sort budgets: active ones first, then inactive ones
    const sortedBudgets = processedBudgets.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return 0;
    });

    if (sortedBudgets.length === 0) {
      const response = new Response.Error(true, "User does not have any budget");
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    response = new Response.Success(
      false,
      "Budgets retrieved successfully",
      sortedBudgets
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
const getBudgetByUserIdAndMonth = async (req, res) => {
  const userId = parseInt(req.params.id);
  const selectedDate = new Date(req.query.date);
  const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);

  try {
    const budgets = await prisma.budget.findMany({
      where: {
        userId: userId,
        detailBudget: {
          some: {
            OR: [
              {
                tanggalMulai: {
                  lte: endOfMonth,
                },
                tanggalSelesai: {
                  gte: startOfMonth,
                },
              },
            ],
          },
        },
      },
      include: {
        kategori: true,
        detailBudget: {
          where: {
            OR: [
              {
                tanggalMulai: {
                  lte: endOfMonth,
                },
                tanggalSelesai: {
                  gte: startOfMonth,
                },
              },
            ],
          },
        },
      },
    });

    if (budgets.length === 0) {
      const response = new Response.Error(true, "No budgets found for the specified month");
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    const processedBudgets = budgets.map(budget => {
      const relevantDetailBudgets = budget.detailBudget.map(detail => ({
        ...detail,
        tanggalMulai: detail.tanggalMulai < startOfMonth ? startOfMonth : detail.tanggalMulai,
        tanggalSelesai: detail.tanggalSelesai > endOfMonth ? endOfMonth : detail.tanggalSelesai,
      }));

      return {
        ...budget,
        detailBudget: relevantDetailBudgets,
      };
    });

    response = new Response.Success(
      false,
      "Budgets for the specified month retrieved successfully",
      processedBudgets
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
  getBudgetByUserIdAndMonth,
};
