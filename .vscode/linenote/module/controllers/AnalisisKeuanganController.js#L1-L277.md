  // controllers/financialAnalysisController.js
  const { PrismaClient } = require('@prisma/client');

  const prisma = new PrismaClient();

  // services/financePredictor.js
  const tf = require('@tensorflow/tfjs');
  const SVM = require('libsvm-js/asm');

  // const predictNextMonthFinances = async (req, res) => {
  //   try {
  //     const userId = req.params.id;
  //     const historicalData = await prisma.bulan.findMany({
  //       where: { userId: parseInt(userId) },
  //       orderBy: [
  //         { tahun: 'asc' },
  //         { bln: 'asc' },
  //       ],
  //       select: {
  //         pemasukan: true,
  //         pengeluaran: true,
  //       },
  //     });

  //     const { predictedIncome, predictedExpense } = await predictFinances(historicalData);
  //     const predictedBalance = predictedIncome - predictedExpense;

  //     res.json({
  //       predictedIncome,
  //       predictedExpense,
  //       predictedBalance,
  //     });
  //   } catch (error) {
  //     res.status(500).json({ error: error.message });
  //   }
  // };


  // const predictFinances = async (historicalData) => {
  //   try {
  //     // Convert data to tensors
  //     const pemasukanTensor = tf.tensor(historicalData.map((data) => data.pemasukan));
  //     const pengeluaranTensor = tf.tensor(historicalData.map((data) => data.pengeluaran));

  //     // Split data into training and testing sets
  //     const [trainPemasukan, testPemasukan] = tf.split(pemasukanTensor, [Math.floor(pemasukanTensor.shape[0] * 0.8), pemasukanTensor.shape[0] - Math.floor(pemasukanTensor.shape[0] * 0.8)]);
  //     const [trainPengeluaran, testPengeluaran] = tf.split(pengeluaranTensor, [Math.floor(pengeluaranTensor.shape[0] * 0.8), pengeluaranTensor.shape[0] - Math.floor(pengeluaranTensor.shape[0] * 0.8)]);

  //     // Create and train the models
  //     const pemasukanModel = await trainModel(trainPemasukan, testPemasukan);
  //     const pengeluaranModel = await trainModel(trainPengeluaran, testPengeluaran);

  //     // Make predictions for the next month
  //     const predictedIncome = await pemasukanModel.predict(tf.tensor([[historicalData.length]])).dataSync()[0];
  //     const predictedExpense = await pengeluaranModel.predict(tf.tensor([[historicalData.length]])).dataSync()[0];

  //     return { predictedIncome, predictedExpense };
  //   } catch (error) {
  //     throw new Error(`Error predicting finances: ${error.message}`);
  //   }
  // };

  // async function trainModel(trainData, testData) {
  //   const model = tf.sequential();
  //   model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [1] }));
  //   model.add(tf.layers.dense({ units: 1 }));
  //   model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

  //   await model.fit(trainData, trainData, {
  //     epochs: 100,
  //     validationData: [testData, testData],
  //     verbose: 0,
  //   });

  //   return model;
  // }
  

  // const predictFinances = async (historicalData) => {
  //   try {
  //     // Convert data to tensors
  //     const pemasukanTensor = tf.tensor(historicalData.map((data) => data.pemasukan));
  //     const pengeluaranTensor = tf.tensor(historicalData.map((data) => data.pengeluaran));
  //     const inputTensor = tf.tensor(historicalData.map((data, index) => index));
  
  //     // Split data into training and testing sets
  //     const [trainPemasukan, testPemasukan] = tf.split(pemasukanTensor, [Math.floor(pemasukanTensor.shape[0] * 0.8), pemasukanTensor.shape[0] - Math.floor(pemasukanTensor.shape[0] * 0.8)]);
  //     const [trainPengeluaran, testPengeluaran] = tf.split(pengeluaranTensor, [Math.floor(pengeluaranTensor.shape[0] * 0.8), pengeluaranTensor.shape[0] - Math.floor(pengeluaranTensor.shape[0] * 0.8)]);
  //     const [trainInput, testInput] = tf.split(inputTensor, [Math.floor(inputTensor.shape[0] * 0.8), inputTensor.shape[0] - Math.floor(inputTensor.shape[0] * 0.8)]);
  
  //     // Create and train the linear regression models
  //     const pemasukanModel = await trainLinearRegressionModel(trainInput, trainPemasukan);
  //     const pengeluaranModel = await trainLinearRegressionModel(trainInput, trainPengeluaran);
  
  //     // Make predictions for the next month
  //     const predictedIncome = pemasukanModel.predict(tf.tensor([[historicalData.length]])).dataSync()[0];
  //     const predictedExpense = pengeluaranModel.predict(tf.tensor([[historicalData.length]])).dataSync()[0];
  
  //     return { predictedIncome, predictedExpense };
  //   } catch (error) {
  //     throw new Error(`Error predicting finances: ${error.message}`);
  //   }
  // };
  
  // async function trainLinearRegressionModel(trainInput, trainOutput) {
  //   const model = tf.sequential();
  //   model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
  //   model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
  
  //   await model.fit(trainInput, trainOutput, {
  //     epochs: 100,
  //     verbose: 0,
  //   });
  
  //   return model;
  // }
  
  const predictNextMonthFinances = async (req, res) => {
    try {
      const bulan = req.params.bulan;
    const tahun = req.params.tahun;
    const userId = req.params.userId;
      const currentMonth = {
        bln: bulan.toString(),
        tahun: tahun.toString()
      };
  
      const { predictedIncome, predictedExpense } = await predictFinances(userId, currentMonth);
      const predictedBalance = predictedIncome - predictedExpense;
  
      res.json({
        predictedIncome,
        predictedExpense,
        predictedBalance,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // const predictFinances = async (userId, currentMonth) => {
  //   try {
  //     // Get the historical daily data for the current user and the month before the current month
  //     const historicalData = await prisma.riwayat.findMany({
  //       where: {
  //         bulanId: {
  //           in: await prisma.bulan.findMany({
  //             where: {
  //               userId: parseInt(userId),
  //               bln: currentMonth.bln,
  //               tahun: currentMonth.tahun,
  //             },
  //             select: {
  //               id: true,
  //             },
  //           }).then((bulanList) => bulanList.map((bulan) => bulan.id)),
  //         },
  //       },
  //       select: {
  //         nominal: true,
  //         tipe: true,
  //       },
  //     });
  
  //     // Convert data to tensors
  //     const pemasukanTensor = tf.tensor(historicalData.filter((data) => data.tipe === 'Pemasukan').map((data) => data.nominal));
  //     const pengeluaranTensor = tf.tensor(historicalData.filter((data) => data.tipe === 'P engeluaran').map((data) => data.nominal));
  //     const inputTensor = tf.tensor(historicalData.map((data, index) => index));
  
  //     // Split data into training and testing sets
  //     const [trainPemasukan, testPemasukan] = tf.split(pemasukanTensor, [Math.floor(pemasukanTensor.shape[0] * 0.8), pemasukanTensor.shape[0] - Math.floor(pemasukanTensor.shape[0] * 0.8)]);
  //     const [trainPengeluaran, testPengeluaran] = tf.split(pengeluaranTensor, [Math.floor(pengeluaranTensor.shape[0] * 0.8), pengeluaranTensor.shape[0] - Math.floor(pengeluaranTensor.shape[0] * 0.8)]);
  //     const [trainInput, testInput] = tf.split(inputTensor, [Math.floor(inputTensor.shape[0] * 0.8), inputTensor.shape[0] - Math.floor(inputTensor.shape[0] * 0.8)]);
  
  //     // Create and train the linear regression models
  //     const pemasukanModel = await trainLinearRegressionModel(trainInput, trainPemasukan);
  //     const pengeluaranModel = await trainLinearRegressionModel(trainInput, trainPengeluaran);
  
  //     // Make predictions for the next month
  //     const predictedIncome = pemasukanModel.predict(tf.tensor([[historicalData.filter((data) => data.tipe === 'pemasukan').length]])).dataSync()[0];
  //     const predictedExpense = pengeluaranModel.predict(tf.tensor([[historicalData.filter((data) => data.tipe === 'pengeluaran').length]])).dataSync()[0];
  
  //     return { predictedIncome, predictedExpense };
  //   } catch (error) {
  //     throw new Error(`Error predicting finances: ${error.message}`);
  //   }
  // };
  
  // async function trainLinearRegressionModel(trainInput, trainOutput) {
  //   const model = tf.sequential();
  //   model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
  //   model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
  
  //   await model.fit(trainInput, trainOutput, {
  //     epochs: 100,
  //     verbose: 0,
  //   });
  
  //   return model;
  // }
 const predictFinances = async (userId, currentMonth) => {
  try {
    // Get the historical daily data for the current user and the month before the current month
    const historicalData = await prisma.riwayat.findMany({
      where: {
        bulanId: {
          in: await prisma.bulan.findMany({
            where: {
              userId: parseInt(userId),
              bln: currentMonth.bln,
              tahun: currentMonth.tahun,
            },
            select: {
              id: true,
            },
          }).then((bulanList) => bulanList.map((bulan) => bulan.id)),
        },
      },
      select: {
        nominal: true,
        tipe: true,
      },
    });

    // Check if there's enough data
    if (historicalData.length < 2) {
      throw new Error("Insufficient data for prediction");
    }

    // Convert data to tensors
    const financeData = tf.tensor2d(historicalData.map((data) => [
      data.tipe === 'Pemasukan' ? data.nominal : 0,
      data.tipe === 'Pengeluaran' ? data.nominal : 0,
    ]));

    // Get the number of samples
    const numSamples = financeData.shape[0];

    // Split data into training and testing sets
    const trainSize = Math.max(1, Math.floor(numSamples * 0.8));
    const trainData = financeData.slice([0, 0], [trainSize, -1]);
    const testData = financeData.slice([trainSize, 0], [-1, -1]);

    // Create and train the linear regression model
    const model = await trainLinearRegressionModel(trainData.slice([0, 0], [-1, -1]), trainData.slice([-1, 0], [-1, -1]));

    // Make predictions for the next month
    const predictedFinance = model.predict(testData.slice([-1, 0], [-1, -1])).dataSync();
    const predictedIncome = predictedFinance[0];
    const predictedExpense = predictedFinance[1];

    return { predictedIncome, predictedExpense };
  } catch (error) {
    throw new Error(`Error predicting finances: ${error.message}`);
  }
};

async function trainLinearRegressionModel(trainInput, trainOutput) {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 2, inputShape: [2] }));
  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

  await model.fit(trainInput, trainOutput, {
    epochs: 100,
    verbose: 0,
  });

  return model;
}
  
  module.exports = {
    predictFinances,
  };

  module.exports = {
    predictNextMonthFinances,
  };