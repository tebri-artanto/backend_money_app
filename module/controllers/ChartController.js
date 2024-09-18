const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Response = require("../model/Response");
const httpStatus = require("http-status");

const getWeeklyExpenseIncome = async (req, res) => {
  try {
    const userId = req.params.userId;
    const selectedDate = new Date(req.query.date || new Date());

    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const weeklyData = await prisma.riwayat.groupBy({
      by: ['tipe', 'tanggal'],
      where: {
        tanggal: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
        bulan: {
          user: {
            id: parseInt(userId),
          },
        },
      },
      _sum: {
        nominal: true,
      },
    });

    const expenseByDay = {};
    const incomeByDay = {};

    weeklyData.forEach((data) => {
      const { tipe, tanggal, _sum } = data;
      const day = tanggal.getDay();
      if (tipe === 'Pengeluaran') {
        expenseByDay[day] = (_sum.nominal || 0) + (expenseByDay[day] || 0);
      } else if (tipe === 'Pemasukan') {
        incomeByDay[day] = (_sum.nominal || 0) + (incomeByDay[day] || 0);
      }
    });

    const daysOfWeek = [
      'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
    ];

    const weeklyExpenseIncome = daysOfWeek.map((day, index) => ({
      day,
      expense: expenseByDay[index] || 0,
      income: incomeByDay[index] || 0,
    }));

    res.json(new Response.Success(false, 'Weekly expense and income retrieved successfully', weeklyExpenseIncome));
  } catch (error) {
    console.error(error);
    res.status(500).json(new Response.Error(true, 'Internal server error'));
  }
};

const getRiwayatByUserIdAndTimeframe = async (req, res) => {
  let response = null;
  try {
    const userId = req.params.id;
    const timeframe = req.query.timeframe;
    const selectedDate = new Date(req.query.date || new Date());

    if (timeframe === 'weekly') {
      response = await getWeeklyRiwayat(userId, selectedDate);
    } else if (timeframe === 'monthly') {
      response = await getMonthlyRiwayat(userId, selectedDate);
    } else {
      throw new Error('Invalid timeframe');
    }

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
    },
    include: {
      kategori: true,
    },
  });

  const expensesByKategori = {};
  const incomeByKategori = {};

  riwayat.forEach((item) => {
    const kategoriName = item.kategori.namaKategori;
    if (item.tipe === 'Pengeluaran') {
      if (!expensesByKategori[kategoriName]) {
        expensesByKategori[kategoriName] = 0;
      }
      expensesByKategori[kategoriName] += item.nominal;
    } else if (item.tipe === 'Pemasukan') {
      if (!incomeByKategori[kategoriName]) {
        incomeByKategori[kategoriName] = 0;
      }
      incomeByKategori[kategoriName] += item.nominal;
    }
  });

  return new Response.Success(
    false,
    'Riwayat retrieved successfully',
    { expenses: expensesByKategori, income: incomeByKategori }
  );
};

const getMonthlyRiwayat = async (userId, selectedDate) => {
  const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);

  const riwayat = await prisma.riwayat.findMany({
    where: {
      bulan: {
        userId: parseInt(userId),
      },
      tanggal: {
        gte: startDate.toISOString(),
        lte: endDate.toISOString(),
      },
    },
    include: {
      kategori: true,
    },
  });
  const expensesByKategori = {};
  const incomeByKategori = {};

  riwayat.forEach((item) => {
    const kategoriName = item.kategori.namaKategori;
    if (item.tipe === 'Pengeluaran') {
      if (!expensesByKategori[kategoriName]) {
        expensesByKategori[kategoriName] = 0;
      }
      expensesByKategori[kategoriName] += item.nominal;
    } else if (item.tipe === 'Pemasukan') {
      if (!incomeByKategori[kategoriName]) {
        incomeByKategori[kategoriName] = 0;
      }
      incomeByKategori[kategoriName] += item.nominal;
    }
  });

  return new Response.Success(
    false,
    'Riwayat retrieved successfully',
    { expenses: expensesByKategori, income: incomeByKategori }
  );
};

const getRincianByUserIdAndTimeframe = async (req, res) => {
  let response = null;
  try {
    const userId = req.params.id;
    const timeframe = req.query.timeframe;
    const selectedDate = new Date(req.query.date || new Date());

    if (timeframe === 'weekly') {
      response = await getWeeklyRincian(userId, selectedDate);
    } else if (timeframe === 'monthly') {
      response = await getMonthlyRincian(userId, selectedDate);
    } else {
      throw new Error('Invalid timeframe');
    }

    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getWeeklyRincian = async (userId, selectedDate) => {
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
    },
    include: {
      kategori: true,
    },
  });

  const rincianPengeluaran = {};
  const rincianPemasukan = {};

  riwayat.forEach((item) => {
    const kategoriName = item.kategori.namaKategori;
    if (item.tipe === 'Pengeluaran') {
      if (!rincianPengeluaran[kategoriName]) {
        rincianPengeluaran[kategoriName] = 0;
      }
      rincianPengeluaran[kategoriName] += item.nominal;
    } else if (item.tipe === 'Pemasukan') {
      if (!rincianPemasukan[kategoriName]) {
        rincianPemasukan[kategoriName] = 0;
      }
      rincianPemasukan[kategoriName] += item.nominal;
    }
  });

  return new Response.Success(
    false,
    'Rincian retrieved successfully',
    { pengeluaran: rincianPengeluaran, pemasukan: rincianPemasukan }
  );
};

const getMonthlyRincian = async (userId, selectedDate) => {
  const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);

  const riwayat = await prisma.riwayat.findMany({
    where: {
      bulan: {
        userId: parseInt(userId),
      },
      tanggal: {
        gte: startDate.toISOString(),
        lte: endDate.toISOString(),
      },
    },
    include: {
      kategori: true,
    },
  });

  const rincianPengeluaran = {};
  const rincianPemasukan = {};

  riwayat.forEach((item) => {
    const kategoriName = item.kategori.namaKategori;
    if (item.tipe === 'Pengeluaran') {
      if (!rincianPengeluaran[kategoriName]) {
        rincianPengeluaran[kategoriName] = 0;
      }
      rincianPengeluaran[kategoriName] += item.nominal;
    } else if (item.tipe === 'Pemasukan') {
      if (!rincianPemasukan[kategoriName]) {
        rincianPemasukan[kategoriName] = 0;
      }
      rincianPemasukan[kategoriName] += item.nominal;
    }
  });

  return new Response.Success(
    false,
    'Rincian retrieved successfully',
    { pengeluaran: rincianPengeluaran, pemasukan: rincianPemasukan }
  );

  
};

const getWeeklyIncomeExpenseChart = async (req, res) => {
  try {
    const userId = req.params.userId;
    const selectedDate = new Date(req.query.date || new Date());
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

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
      },
      select: {
        tanggal: true,
        tipe: true,
        nominal: true,
      },
    });
    // Initialize weekly totals
    const weeklyTotals = Array.from({ length: 5 }, () => ({ income: 0, expense: 0 }));

    riwayatData.forEach((data) => {
      const weekIndex = Math.floor((data.tanggal.getDate() - 1) / 7);
      
      if (data.tipe === 'Pemasukan') {
        weeklyTotals[weekIndex].income += data.nominal;
      } else if (data.tipe === 'Pengeluaran') {
        weeklyTotals[weekIndex].expense += data.nominal;
      }
    });

    const chartData = weeklyTotals.map((total, index) => ({
      week: `Minggu ${index + 1}`,
      income: total.income,
      expense: total.expense,
    }));

    res.status(httpStatus.OK).json(new Response.Success(false, 'Weekly income and expense data retrieved successfully', chartData));
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json(new Response.Error(true, 'Internal server error'));
  }
};

const getMonthlyTotals = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const selectedDate = new Date(req.query.date || new Date());
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

    const totals = await prisma.riwayat.groupBy({
      by: ['tipe'],
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
      },
      _sum: {
        nominal: true,
      },
    });

    const result = {
      income: 0,
      expense: 0,
    };

    totals.forEach((total) => {
      if (total.tipe === 'Pemasukan') {
        result.income = total._sum.nominal || 0;
      } else if (total.tipe === 'Pengeluaran') {
        result.expense = total._sum.nominal || 0;
      }
    });

    res.json(new Response.Success(false, 'Monthly totals retrieved successfully', result));
  } catch (error) {
    console.error(error);
    res.status(500).json(new Response.Error(true, 'Internal server error'));
  }
};

const getNextMonthPrediction = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const selectedDate = new Date(req.query.date || new Date());
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

    // Get average income and expense for the last 3 months
    const lastThreeMonths = await prisma.riwayat.groupBy({
      by: ['tipe'],
      where: {
        tanggal: {
          gte: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() - 2, 1),
          lte: endOfMonth,
        },
        bulan: {
          user: {
            id: userId,
          },
        },
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
      if (avg.tipe === 'Pemasukan') {
        result.income = avg._avg.nominal || 0;
      } else if (avg.tipe === 'Pengeluaran') {
        result.expense = avg._avg.nominal || 0;
      }
    });

    res.json(new Response.Success(false, 'Next month prediction retrieved successfully', result));
  } catch (error) {
    console.error(error);
    res.status(500).json(new Response.Error(true, 'Internal server error'));
  }
};

const getBudgetAnalysis = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const selectedDate = new Date(req.query.date || new Date());
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

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

    const result = await Promise.all(budgets.map(async (budget) => {
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
    }));

    res.json(new Response.Success(false, 'Budget analysis retrieved successfully', result));
  } catch (error) {
    console.error(error);
    res.status(500).json(new Response.Error(true, 'Internal server error'));
  }
};


module.exports = {
  getWeeklyExpenseIncome,
  getRiwayatByUserIdAndTimeframe,
  getRincianByUserIdAndTimeframe,
  getWeeklyIncomeExpenseChart,
  getMonthlyTotals,
  getNextMonthPrediction,
  getBudgetAnalysis,
};