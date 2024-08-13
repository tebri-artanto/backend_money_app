const tf = require('@tensorflow/tfjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PredictionService {
  constructor() {
    this.models = {};
    this.lastTrainingDate = null;
  }

  // Helper function to get the week number of a date
  getWeekNumber(d) {
    const date = new Date(d);
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  async prepareData(userId) {
    const expenseData = await prisma.riwayat.findMany({
      where: {
        bulan: { user: { id: userId } },
        tipe: 'Pengeluaran',
        tanggal: { gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
      },
      include: {
        kategori: true,
        bulan: true
      },
      orderBy: { tanggal: 'asc' }
    });

    const groupedData = {};
    expenseData.forEach(expense => {
      const category = expense.kategori.namaKategori;
      const year = expense.tanggal.getFullYear();
      const week = this.getWeekNumber(expense.tanggal);
      const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;

      if (!groupedData[category]) groupedData[category] = {};
      if (!groupedData[category][weekKey]) groupedData[category][weekKey] = 0;
      groupedData[category][weekKey] += expense.nominal;
    });

    console.log("Grouped Data:");
    console.log(groupedData);

    return groupedData;
  }

  async trainModel(data) {
    console.log("Training model...");
    const categories = Object.keys(data);
    this.models = {};

    for (const category of categories) {
      const categoryData = Object.values(data[category]);

      if (categoryData.length < 2) {
        // Jika hanya ada satu data point, gunakan itu sebagai prediksi
        this.models[category] = { average: categoryData[0], singleDataPoint: true };
        continue;
      }

      // Hitung rata-rata pengeluaran untuk kategori ini
      const average = categoryData.reduce((sum, value) => sum + value, 0) / categoryData.length;

      // Normalisasi data
      const normalizedData = categoryData.map(value => value / average);

      const tensorData = tf.tensor2d(normalizedData.map((value, index) => [index, value]));

      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
      model.compile({ loss: 'meanSquaredError', optimizer: 'adam' });

      await model.fit(
        tensorData.slice([0, 0], [-1, 1]),
        tensorData.slice([0, 1], [-1, 1]),
        { epochs: 100, verbose: 0 }
      );

      this.models[category] = { model, average };
    }

    this.lastTrainingDate = new Date();
  }

  async predict(userId, data, weeks = 1) {
    const now = new Date();

    // Check if the model needs retraining
    const retrainNeeded = !this.lastTrainingDate || (now - this.lastTrainingDate) > 0 * 24 * 60 * 60 * 1000;
    
    // Train model if needed
    if (retrainNeeded) {
      await this.trainModel(data);
    }

    const rawPredictions = {};
    for (const [category, modelData] of Object.entries(this.models)) {
      if (modelData.singleDataPoint) {
        // Jika hanya ada satu data point, gunakan itu sebagai prediksi
        rawPredictions[category] = modelData.average;
      } else {
        const { model, average } = modelData;
        const lastIndex = Object.keys(data[category]).length - 1;
        const nextWeekPrediction = model.predict(tf.tensor2d([[lastIndex + weeks]]));
        const normalizedPrediction = await nextWeekPrediction.data();

        // Denormalisasi prediksi
        rawPredictions[category] = Math.max(0, normalizedPrediction[0] * average);
      }
    }

    // Ambil prediksi sebelumnya dari database
    const previousPredictions = await prisma.prediction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    const smoothedPredictions = {};
    const smoothingFactor = 0.2; // Bisa disesuaikan

    for (const [category, rawValue] of Object.entries(rawPredictions)) {
      const previousValue = previousPredictions.find(p => p.category === category)?.amount || rawValue;
      smoothedPredictions[category] = Math.max(1, smoothingFactor * rawValue + (1 - smoothingFactor) * previousValue);
    }

    // Simpan prediksi baru ke database
    await Promise.all(
      Object.entries(smoothedPredictions).map(([category, amount]) =>
        prisma.prediction.create({
          data: { userId, category, amount }
        })
      )
    );

    return smoothedPredictions;
  }

}

module.exports = new PredictionService();
