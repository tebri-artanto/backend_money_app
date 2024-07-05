const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
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

module.exports = { getWeeklyExpenseIncome };