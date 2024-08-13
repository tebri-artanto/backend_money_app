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
        by: ['tipe'],
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
      const { tipe, day, _sum } = data;
      if (tipe === 'Pengeluaran') {
        expenseByDay[day] = _sum.nominal;
      } else if (tipe === 'Pemasukan') {
        incomeByDay[day] = _sum.nominal;
      }
    });

    const daysOfWeek = [
      'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
    ];

    const weeklyExpenseIncome = daysOfWeek.map((day) => ({
      day,
      expense: expenseByDay[day] || 0,
      income: incomeByDay[day] || 0,
    }));

    res.json(weeklyExpenseIncome);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// In your backend controller file (e.g., riwayatController.js)

// In your backend controller file (e.g., riwayatController.js)

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

  console.log(startDate.toISOString(), endDate.toISOString());
  console.log(userId);
  const riwayat = await prisma.riwayat.findMany({
    where: {
      bulan: {
        userId: parseInt(userId),
      },
      tanggal: {
        gte: startDate.toISOString(),
        lte: endDate.toISOString(),
      },
      tipe: 'Pengeluaran', // Filter by expense type
    },
    include: {
      kategori: true,
    },
  });
  // console.log(riwayat);

  // Group the expenses by Kategori
  const expensesByKategori = {};
  riwayat.forEach((item) => {
    const kategoriName = item.kategori.namaKategori;
    if (!expensesByKategori[kategoriName]) {
      expensesByKategori[kategoriName] = 0;
    }
    expensesByKategori[kategoriName] += item.nominal;
  });

  return new Response.Success(
    false,
    'Riwayat retrieved successfully',
    expensesByKategori
  );
};

const getMonthlyRiwayat = async (userId) => {
  console.log('monthly');
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

  console.log(startDate.toISOString(), endDate.toISOString());

  const riwayat = await prisma.riwayat.findMany({
    where: {
      bulan: {
        userId: parseInt(userId),
      },
      tanggal: {
        gte: startDate.toISOString(),
        lte: endDate.toISOString(),
      },
      tipe: 'Pengeluaran', // Filter by expense type
    },
    include: {
      kategori: true,
    },
  });
  // console.log(riwayat);

  // Group the expenses by Kategori
  const expensesByKategori = {};
  riwayat.forEach((item) => {
    const kategoriName = item.kategori.namaKategori;
    if (!expensesByKategori[kategoriName]) {
      expensesByKategori[kategoriName] = 0;
    }
    expensesByKategori[kategoriName] += item.nominal;
  });

  return new Response.Success(
    false,
    'Riwayat retrieved successfully',
    expensesByKategori
  );
};
const getRincianPengeluaranByUserIdAndTimeframe = async (req, res) => {
  let response = null;
  try {
    const userId = req.params.id;
    const timeframe = req.query.timeframe;

    if (timeframe === 'weekly') {
      response = await getWeeklyRincianPengeluaran(userId);
    } else if (timeframe === 'monthly') {
      response = await getMonthlyRincianPengeluaran(userId);
    } else {
      throw new Error('Invalid timeframe');
    }

    res.status(httpStatus.OK).json(response);
  } catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

const getWeeklyRincianPengeluaran = async (userId) => {
  const currentDate = new Date();
  const currentDay = currentDate.getDay();
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() - daysToMonday);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  console.log(startDate.toISOString(), endDate.toISOString());
  console.log(userId);

  const riwayat = await prisma.riwayat.findMany({
    where: {
      bulan: {
        userId: parseInt(userId),
      },
      tanggal: {
        gte: startDate.toISOString(),
        lte: endDate.toISOString(),
      },
      tipe: 'Pengeluaran', // Filter by expense type
    },
    include: {
      kategori: true,
    },
  });

  // Group the expenses by Kategori
  const rincianPengeluaran = {};
  riwayat.forEach((item) => {
    const kategoriName = item.kategori.namaKategori;
    if (!rincianPengeluaran[kategoriName]) {
      rincianPengeluaran[kategoriName] = 0;
    }
    rincianPengeluaran[kategoriName] += item.nominal;
  });

  return new Response.Success(
    false,
    'Rincian pengeluaran retrieved successfully',
    rincianPengeluaran
  );
};

const getMonthlyRincianPengeluaran = async (userId) => {
  console.log('monthly');
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

  console.log(startDate.toISOString(), endDate.toISOString());

  const riwayat = await prisma.riwayat.findMany({
    where: {
      bulan: {
        userId: parseInt(userId),
      },
      tanggal: {
        gte: startDate.toISOString(),
        lte: endDate.toISOString(),
      },
      tipe: 'Pengeluaran', // Filter by expense type
    },
    include: {
      kategori: true,
    },
  });

  // Group the expenses by Kategori
  const rincianPengeluaran = {};
  riwayat.forEach((item) => {
    const kategoriName = item.kategori.namaKategori;
    if (!rincianPengeluaran[kategoriName]) {
      rincianPengeluaran[kategoriName] = 0;
    }
    rincianPengeluaran[kategoriName] += item.nominal;
  });

  return new Response.Success(
    false,
    'Rincian pengeluaran retrieved successfully',
    rincianPengeluaran
  );
};

// Add this new route in your backend routes file (e.g., riwayatRoutes.js)

module.exports = { getWeeklyExpenseIncome,
  getRiwayatByUserIdAndTimeframe,
  getRincianPengeluaranByUserIdAndTimeframe
 };