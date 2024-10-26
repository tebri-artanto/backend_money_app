const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const Response = require("../model/Response");
const httpStatus = require("http-status");

const getRiwayatByUserIdAndTimeframe = async (req, res) => {
  let response = null;
  try {
    const userId = req.params.id;
    const timeframe = req.query.timeframe;
    const selectedDate = new Date(req.query.date || new Date());

    if (timeframe === "weekly") {
      response = await getWeeklyRiwayat(userId, selectedDate);
    } else if (timeframe === "monthly") {
      response = await getMonthlyRiwayat(userId, selectedDate);
    } else {
      throw new Error("Invalid timeframe");
    }
    console.log("response");
console.log(response);
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getWeeklyRiwayat = async (userId, selectedDate) => {
  const startDate = new Date(selectedDate);
  startDate.setDate(selectedDate.getDate() - selectedDate.getDay());
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  const riwayat = await prisma.riwayat.findMany({
    where: {
      bulan: {
        userId: parseInt(userId),
      },
      tanggal: {
        gte: startDate.toISOString(),
        lte: endDate.toISOString(),
      },
      deleted: false,
    },
    include: {
      kategori: true,
    },
  });

  const expensesByKategori = {};
  const incomeByKategori = {};
  const savingsByKategori = {};

  riwayat.forEach((item) => {
    const kategoriName = item.kategori.namaKategori;
    if (item.tipe === "Pengeluaran") {
      if (!expensesByKategori[kategoriName]) {
        expensesByKategori[kategoriName] = 0;
      }
      expensesByKategori[kategoriName] += item.nominal;
    } else if (item.tipe === "Pemasukan") {
      if (!incomeByKategori[kategoriName]) {
        incomeByKategori[kategoriName] = 0;
      }
      incomeByKategori[kategoriName] += item.nominal;
    } else if (item.tipe === "Tabungan") {
      if (!savingsByKategori[kategoriName]) {
        savingsByKategori[kategoriName] = 0;
      }
      savingsByKategori[kategoriName] += item.nominal;
    }
  });

  return new Response.Success(false, "Riwayat retrieved successfully", {
    expenses: expensesByKategori,
    income: incomeByKategori,
    savings: savingsByKategori,
  });
};

const getMonthlyRiwayat = async (userId, selectedDate) => {
  const startDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  );
  const endDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  const riwayat = await prisma.riwayat.findMany({
    where: {
      bulan: {
        userId: parseInt(userId),
      },
      tanggal: {
        gte: startDate.toISOString(),
        lte: endDate.toISOString(),
      },
      deleted: false,
    },
    include: {
      kategori: true,
    },
  });
  const expensesByKategori = {};
  const incomeByKategori = {};
  const savingsByKategori = {};


  riwayat.forEach((item) => {
    const kategoriName = item.kategori.namaKategori;
    if (item.tipe === "Pengeluaran") {
      if (!expensesByKategori[kategoriName]) {
        expensesByKategori[kategoriName] = 0;
      }
      expensesByKategori[kategoriName] += item.nominal;
    } else if (item.tipe === "Pemasukan") {
      if (!incomeByKategori[kategoriName]) {
        incomeByKategori[kategoriName] = 0;
      }
      incomeByKategori[kategoriName] += item.nominal;
    } else if (item.tipe === "Tabungan") {
      if (!savingsByKategori[kategoriName]) {
        savingsByKategori[kategoriName] = 0;
      }
      savingsByKategori[kategoriName] += item.nominal;
    }
  });

  return new Response.Success(false, "Riwayat retrieved successfully", {
    expenses: expensesByKategori,
    income: incomeByKategori,
    savings: savingsByKategori,
  });
};

const totalTabungan = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const savings = await prisma.riwayat.findMany({
      where: {
        bulan: {
          userId: userId,
        },
        deleted: false,
        tipe: "Tabungan",
      },
      include: {
        kategori: true,
      },
    });

    const savingsByKategori = {};
    savings.forEach((item) => {
      const kategoriName = item.kategori.namaKategori;
      
      if (!savingsByKategori[kategoriName]) {
        savingsByKategori[kategoriName] = 0;
      }
      savingsByKategori[kategoriName] += item.nominal;
    });

    res.status(200).json({
      error: false,
      message: "Total tabungan retrieved successfully",
      data: {
        savings: savingsByKategori
      }
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: true,
      message: "Internal server error",
      data: null
    });
  }
};


const getWeeklyIncomeExpenseChart = async (req, res) => {
  try {
    const userId = req.params.userId;
    const selectedDate = new Date(req.query.date || new Date());
    const startOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0
    );

    const riwayatData = await prisma.riwayat.findMany({
      where: {
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        bulan: {
          user: {
            id: parseInt(userId),
          },
        },
        deleted: false,
      },
      select: {
        tanggal: true,
        tipe: true,
        nominal: true,
      },
    });

    const weeklyTotals = Array.from({ length: 5 }, () => ({
      income: 0,
      expense: 0,
      savings: 0,
    }));

    riwayatData.forEach((data) => {
      const weekIndex = Math.floor((data.tanggal.getDate() - 1) / 7);

      if (data.tipe === "Pemasukan") {
        weeklyTotals[weekIndex].income += data.nominal;
      } else if (data.tipe === "Pengeluaran") {
        weeklyTotals[weekIndex].expense += data.nominal;
      } else if (data.tipe === "Tabungan") {
        weeklyTotals[weekIndex].savings += data.nominal;
      }
    });

    const chartData = weeklyTotals.map((total, index) => ({
      week: `Minggu ${index + 1}`,
      income: total.income,
      expense: total.expense,
      savings: total.savings,
    }));
console.log('chartData');
    console.log(chartData);
    res
      .status(httpStatus.OK)
      .json(
        new Response.Success(
          false,
          "Weekly income and expense data retrieved successfully",
          chartData
        )
      );
  } catch (error) {
    console.error(error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(new Response.Error(true, "Internal server error"));
  }
};

const getMonthlyTotals = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const selectedDate = new Date(req.query.date || new Date());
    const startOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0
    );

    const totals = await prisma.riwayat.groupBy({
      by: ["tipe"],
      where: {
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        bulan: {
          user: {
            id: userId,
          },
        },
        deleted: false,
      },
      _sum: {
        nominal: true,
      },
    });

    const result = {
      income: 0,
      expense: 0,
      savings: 0,
    };
    console.log("totals");
    console.log(totals);

    totals.forEach((total) => {
      if (total.tipe === "Pemasukan") {
        result.income = parseFloat(total._sum.nominal) || 0;
      } else if (total.tipe === "Pengeluaran") {
        result.expense = parseFloat(total._sum.nominal) || 0;
      } else if (total.tipe === "Tabungan") {
        result.savings = parseFloat(total._sum.nominal) || 0;
      }
    });

    console.log(result);

    res.json(
      new Response.Success(
        false,
        "Monthly totals retrieved successfully",
        result
      )
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(new Response.Error(true, "Internal server error"));
  }
};

const getNextMonthPrediction = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const selectedDate = new Date(req.query.date || new Date());
    const startOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0
    );

    const lastThreeMonths = await prisma.riwayat.groupBy({
      by: ["tipe"],
      where: {
        tanggal: {
          gte: new Date(
            startOfMonth.getFullYear(),
            startOfMonth.getMonth() - 2,
            1
          ),
          lte: endOfMonth,
        },
        bulan: {
          user: {
            id: userId,
          },
        },
        deleted: false,
      },
      _avg: {
        nominal: true,
      },
    });

    const result = {
      income: 0,
      expense: 0,
    };

    lastThreeMonths.forEach((avg) => {
      if (avg.tipe === "Pemasukan") {
        result.income = parseFloat(avg._avg.nominal) || 0;
      } else if (avg.tipe === "Pengeluaran") {
        result.expense = parseFloat(avg._avg.nominal) || 0;
      }
    });

    res.json(
      new Response.Success(
        false,
        "Next month prediction retrieved successfully",
        result
      )
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(new Response.Error(true, "Internal server error"));
  }
};

const getBudgetAnalysis = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const selectedDate = new Date(req.query.date || new Date());
    const startOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0
    );

    const budgets = await prisma.budget.findMany({
      where: {
        userId: userId,
        detailBudget: {
          some: {
            tanggalMulai: {
              lte: endOfMonth,
            },
            tanggalSelesai: {
              gte: startOfMonth,
            },
          },
        },
      },
      include: {
        kategori: true,
        detailBudget: {
          where: {
            tanggalMulai: {
              lte: endOfMonth,
            },
            tanggalSelesai: {
              gte: startOfMonth,
            },
          },
        },
      },
    });

    const result = await Promise.all(
      budgets.map(async (budget) => {
        const usedAmount = await prisma.riwayat.aggregate({
          where: {
            kategoriId: budget.kategoriId,
            tanggal: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
            bulan: {
              user: {
                id: userId,
              },
            },
            deleted: false,
          },
          _sum: {
            nominal: true,
          },
        });

        return {
          category: budget.kategori.namaKategori,
          total: budget.jumlahBudget,
          used: usedAmount._sum.nominal || 0,
        };
      })
    );

    res.json(
      new Response.Success(
        false,
        "Budget analysis retrieved successfully",
        result
      )
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(new Response.Error(true, "Internal server error"));
  }
};

const analyzeBudgetUsage = async (req, res) => {
  try {
    console.log(req.user);
    console.log(req.query);
    const userId = req.user.id;
    const selectedDate = new Date(req.query.date || new Date());
    const startOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0
    );

    const budgetsWithExpenses = await prisma.budget.findMany({
      where: {
        userId: userId,
        detailBudget: {
          some: {
            tanggalMulai: { lte: endOfMonth },
            tanggalSelesai: { gte: startOfMonth },
          },
        },
      },
      include: {
        kategori: true,
        detailBudget: {
          where: {
            tanggalMulai: { lte: endOfMonth },
            tanggalSelesai: { gte: startOfMonth },
          },
          include: {
            _count: {
              select: { riwayat: true },
            },
          },
        },
      },
    });
    const categoryExpenses = await prisma.riwayat.groupBy({
      by: ["kategoriId"],
      where: {
        bulan: {
          user: { id: userId },
        },
        tipe: "Pengeluaran",
        deleted: false,
      },
      _avg: {
        nominal: true,
      },
    });

    const analysisResults = await Promise.all(
      budgetsWithExpenses.map(async (budget) => {
        const actualExpense = await prisma.riwayat.aggregate({
          where: {
            kategoriId: budget.kategoriId,
            tanggal: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
            bulan: {
              user: { id: userId },
            },
            tipe: "Pengeluaran",
            deleted: false,
          },
          _sum: { nominal: true },
        });

        const budgetAmount = budget.jumlahBudget || 0;
        const expenseAmount = actualExpense._sum.nominal || 0;
        const usagePercentage = (expenseAmount / budgetAmount) * 100;
        const transactionCount = budget.detailBudget.reduce(
          (total, detail) => total + (detail._count?.riwayat || 0),
          0
        );

        const avgExpense =
          categoryExpenses.find(
            (expense) => expense.kategoriId === budget.kategoriId
          )?._avg?.nominal || 0;

        let status, recommendation;
        if (usagePercentage <= 80) {
          status = "Baik";
          recommendation =
            "Anda berhasil mengelola pengeluaran dengan baik. Pertahankan kebiasaan ini.";
        } else if (usagePercentage <= 100) {
          status = "Waspada";
          recommendation =
            "Pengeluaran Anda mendekati batas anggaran. Perhatikan pengeluaran Anda dengan lebih cermat.";
        } else {
          status = "Melebihi Anggaran";
          recommendation =
            "Pengeluaran Anda melebihi anggaran. Coba kurangi pengeluaran non-esensial dan evaluasi kembali anggaran Anda.";
        }

        return {
          kategori: budget.kategori.namaKategori,
          anggaran: budgetAmount,
          pengeluaranAktual: expenseAmount,
          persentasePenggunaan: usagePercentage.toFixed(2),
          jumlahTransaksi: transactionCount,
          rataRataPengeluaran: avgExpense,
          status,
          rekomendasi: recommendation,
        };
      })
    );

    const overallRecommendation =
      generateOverallRecommendation(analysisResults);

    res.json(
      new Response.Success(false, "Analisis anggaran berhasil", {
        analysisResults,
        overallRecommendation,
      })
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(new Response.Error(true, "Internal server error"));
  }
};

const generateOverallRecommendation = (analysisResults) => {
  const overBudgetCategories = analysisResults.filter(
    (result) => parseFloat(result.persentasePenggunaan) > 100
  );
  const underBudgetCategories = analysisResults.filter(
    (result) => parseFloat(result.persentasePenggunaan) < 80
  );

  let recommendation = "Berdasarkan analisis pengeluaran bulan ini:\n\n";

  analysisResults.forEach((result) => {
    recommendation += `- ${result.kategori}: `;
    if (result.pengeluaranAktual > result.rataRataPengeluaran) {
      recommendation += `Pengeluaran bulan ini (${formatRupiah(
        result.pengeluaranAktual
      )}) lebih tinggi dari rata-rata (${formatRupiah(
        result.rataRataPengeluaran
      )}). Pertimbangkan untuk mengurangi pengeluaran di kategori ini.\n`;
    } else {
      recommendation += `Pengeluaran bulan ini (${formatRupiah(
        result.pengeluaranAktual
      )}) lebih rendah dari atau sama dengan rata-rata (${formatRupiah(
        result.rataRataPengeluaran
      )}). Pertahankan pengeluaran Anda di kategori ini.\n`;
    }
  });

  if (overBudgetCategories.length > 0) {
    recommendation +=
      "\nKategori yang melebihi anggaran: " +
      overBudgetCategories.map((c) => c.kategori).join(", ") +
      ". Pertimbangkan untuk mengevaluasi dan menyesuaikan anggaran atau mengurangi pengeluaran di kategori ini.\n";
  }

  if (underBudgetCategories.length > 0) {
    recommendation +=
      "\nKategori dengan penggunaan di bawah 80%: " +
      underBudgetCategories.map((c) => c.kategori).join(", ") +
      ". Anda bisa mempertimbangkan untuk mengalokasikan kelebihan anggaran ini ke kategori lain atau menabung.\n";
  }

  recommendation +=
    "\nTerus pantau pengeluaran Anda dan sesuaikan anggaran sesuai kebutuhan untuk mencapai tujuan keuangan Anda.";

  return recommendation;
};

const formatRupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(number);
};


module.exports = {
  getRiwayatByUserIdAndTimeframe,
  getWeeklyIncomeExpenseChart,
  getMonthlyTotals,
  getNextMonthPrediction,
  getBudgetAnalysis,
  analyzeBudgetUsage,
  totalTabungan,
};
