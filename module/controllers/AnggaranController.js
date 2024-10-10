const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const httpStatus = require("http-status");
const Response = require("../model/Response");

let response = null;
const addBudget = async (req, res) => {
  try {
    const {
      kategoriId,
      userId,
      jumlahBudget,
      frekuensi,
      tanggalMulai,
      tanggalSelesai,
      isBerulang,
    } = req.body;
    const startDate = new Date(tanggalMulai);
    const endDate = tanggalSelesai ? new Date(tanggalSelesai) : null;

    const overlappingBudgets = await prisma.budget.findMany({
      where: {
        userId: parseInt(userId),
        kategoriId: parseInt(kategoriId),
        detailBudget: {
          some: {
            OR: [
              {
                tanggalMulai: { lte: startDate },
                tanggalSelesai: { gte: startDate },
              },
              {
                tanggalMulai: { lte: endDate },
                tanggalSelesai: { gte: endDate },
              },
              {
                tanggalMulai: { gte: startDate },
                tanggalSelesai: { lte: endDate },
              },
            ],
          },
        },
      },
    });

    if (overlappingBudgets.length > 0) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(
          new Response.Error(
            true,
            "Budget already exists for the given date range"
          )
        );
    }

    const budget = await prisma.budget.create({
      data: {
        jumlahBudget: parseFloat(jumlahBudget),
        kategoriId: parseInt(kategoriId),
        userId: parseInt(userId),
        frekuensi,
        isBerulang,
        status: "Aktif",
      },
    });

    let currentDate = new Date(startDate);
    let iteration = 1;

    while (currentDate <= endDate) {
      const nextDate =
        frekuensi === "Bulanan" && isBerulang
          ? new Date(currentDate.setDate(currentDate.getDate() + 29))
          : new Date(
              currentDate.setDate(
                currentDate.getDate() + (frekuensi === "Bulanan" ? 29 : 6)
              )
            );
      const riwayatPengeluaran = await prisma.riwayat.findMany({
        where: {
          tanggal: { gte: currentDate, lte: nextDate },
          kategoriId: parseInt(kategoriId),
          tipe: "Pengeluaran",
          deleted: false,
        },
      });
      const totalPengeluaran = riwayatPengeluaran.reduce(
        (total, riwayat) => total + riwayat.nominal,
        0
      );
      const detailBudget = await prisma.detailBudget.create({
        data: {
          budgetId: budget.id,
          sisaBudget: parseFloat(jumlahBudget) - totalPengeluaran,
          terpakai: totalPengeluaran,
          tanggalMulai: currentDate,
          tanggalSelesai: nextDate,
          pengulangan: iteration,
        },
      });
      await prisma.riwayat.updateMany({
        where: {
          id: { in: riwayatPengeluaran.map((riwayat) => riwayat.id) },
          deleted: false,
        },
        data: { detailBudgetId: detailBudget.id },
      });

      currentDate = new Date(nextDate.setDate(nextDate.getDate() + 1));
      iteration++;
    }

    res
      .status(httpStatus.OK)
      .json(new Response.Success(false, "Budget added successfully", budget));
  } catch (error) {
    console.error(error);
    res
      .status(httpStatus.BAD_REQUEST)
      .json(new Response.Error(true, error.message));
  }
};
const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { kategoriId, jumlahBudget, frekuensi, tanggalMulai, tanggalSelesai, isBerulang } = req.body;

    const existingBudget = await prisma.budget.findUnique({
      where: { id: parseInt(id) },
      include: { detailBudget: true },
    });

    if (!existingBudget) {
      response = new Response.Error(true, "Budget not found");
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    const startDate = new Date(tanggalMulai);
    const endDate = tanggalSelesai ? new Date(tanggalSelesai) : null;

    const findOverlappingBudgets = await prisma.budget.findMany({
      where: {
        id: { not: parseInt(id) },
        userId: existingBudget.userId,
        kategoriId: parseInt(kategoriId),
        detailBudget: {
          some: {
            OR: [
              { tanggalMulai: { lte: startDate }, tanggalSelesai: { gte: startDate } },
              { tanggalMulai: { lte: endDate }, tanggalSelesai: { gte: endDate } },
              { tanggalMulai: { gte: startDate }, tanggalSelesai: { lte: endDate } },
            ],
          },
        },
      },
    });

    if (findOverlappingBudgets.length > 0) {
      response = new Response.Error(true,
        "An overlapping budget already exists for the given date range and category"
      );
      return res.status(httpStatus.BAD_REQUEST).json(response);
    }

    const updatedBudget = await prisma.budget.update({
      where: { id: parseInt(id) },
      data: {
        kategoriId: parseInt(kategoriId),
        jumlahBudget: parseFloat(jumlahBudget),
        frekuensi: frekuensi,
        isBerulang: isBerulang,
      },
    });

    await prisma.detailBudget.deleteMany({
      where: { budgetId: parseInt(id) },
    });

    let currentDate = new Date(startDate);
    let iteration = 1;

    while (currentDate <= endDate) {
      let nextDate;
      if (frekuensi === "Bulanan") {
        if (isBerulang) {
          nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() + 29);
        } else {
          nextDate = endDate;
        }
      } else {
        nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 6);
      }
      const riwayatPengeluaran = await prisma.riwayat.findMany({
        where: {
          tanggal: {
            gte: currentDate,
            lte: nextDate,
          },
          kategoriId: parseInt(kategoriId),
          tipe: "Pengeluaran",
          deleted: false,
        },
      });

      const totalPengeluaran = riwayatPengeluaran.reduce(
        (total, riwayat) => total + riwayat.nominal,
        0
      );

      const detailBudgetData = {
        budgetId: updatedBudget.id,
        sisaBudget: parseFloat(jumlahBudget) - totalPengeluaran,
        terpakai: totalPengeluaran,
        tanggalMulai: currentDate,
        tanggalSelesai: nextDate,
        pengulangan: iteration,
      };

      const detailBudget = await prisma.detailBudget.create({
        data: detailBudgetData,
      });

      await prisma.riwayat.updateMany({
        where: {
          id: {
            in: riwayatPengeluaran.map((riwayat) => riwayat.id),
          },
          deleted: false,
        },
        data: {
          detailBudgetId: detailBudget.id,
        },
      });

      currentDate = new Date(nextDate);
      currentDate.setDate(currentDate.getDate() + 1);

      iteration++;
    }
    const finalBudget = await prisma.budget.findUnique({
      where: { id: parseInt(id) },
      include: {
        detailBudget: true,
        kategori: true,
      },
    });

    response = new Response.Success(false, "Budget and related detail budgets updated successfully", finalBudget);
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
        deleted: false,
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
            tanggalMulai: "asc",
          },
        },
      },
    });

    const processedBudgets = budgets.map((budget) => {
      let firstDate = null;
      let lastDate = null;
      let activeDetailBudget = null;

      if (budget.detailBudget.length > 0) {
        firstDate = budget.detailBudget[0].tanggalMulai;
        lastDate =
          budget.detailBudget[budget.detailBudget.length - 1].tanggalSelesai;
        activeDetailBudget = budget.detailBudget.find(
          (detail) =>
            new Date(detail.tanggalMulai) <= today &&
            new Date(detail.tanggalSelesai) >= today
        );
      }
      return {
        ...budget,
        firstDate,
        lastDate,
        activeDetailBudget,
        isActive: !!activeDetailBudget,
      };
    });

    const sortedBudgets = processedBudgets.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return 0;
    });

    if (sortedBudgets.length === 0) {
      const response = new Response.Error(
        true,
        "Pengguna tidak memiliki anggaran"
      );
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    response = new Response.Success(
      false,
      "Anggaran berhasil diambil",
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
  const startOfMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  );
  const endOfMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0,
    23,
    59,
    59
  );

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
      const response = new Response.Error(
        true,
        "No budgets found for the specified month"
      );
      return res.status(httpStatus.NOT_FOUND).json(response);
    }

    const processedBudgets = budgets.map((budget) => {
      const relevantDetailBudgets = budget.detailBudget.map((detail) => ({
        ...detail,
        tanggalMulai:
          detail.tanggalMulai < startOfMonth
            ? startOfMonth
            : detail.tanggalMulai,
        tanggalSelesai:
          detail.tanggalSelesai > endOfMonth
            ? endOfMonth
            : detail.tanggalSelesai,
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
