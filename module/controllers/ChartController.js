const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Response = require("../model/Response");
const httpStatus = require("http-status");

const getWeeklyExpenseIncome = async (req, res) => {
  try {
    const userId = req.params.userId;

    const startOfWeek = new Date();
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

    if (timeframe === 'weekly') {
      response = await getWeeklyRiwayat(userId);
    } else if (timeframe === 'monthly') {
      response = await getMonthlyRiwayat(userId);
    } else {
      throw new Error('Invalid timeframe');
    }

    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getWeeklyRiwayat = async (userId) => {
  const currentDate = new Date();
  const currentDay = currentDate.getDay();
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() - daysToMonday);
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

const getMonthlyRiwayat = async (userId) => {
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

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

    if (timeframe === 'weekly') {
      response = await getWeeklyRincian(userId);
    } else if (timeframe === 'monthly') {
      response = await getMonthlyRincian(userId);
    } else {
      throw new Error('Invalid timeframe');
    }

    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getWeeklyRincian = async (userId) => {
  const currentDate = new Date();
  const currentDay = currentDate.getDay();
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() - daysToMonday);
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

const getMonthlyRincian = async (userId) => {
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

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

module.exports = {
  getWeeklyExpenseIncome,
  getRiwayatByUserIdAndTimeframe,
  getRincianByUserIdAndTimeframe
};