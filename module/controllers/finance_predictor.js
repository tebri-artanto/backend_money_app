// services/financePredictor.js
const tf = require('@tensorflow/tfjs');

exports.predictFinances = async (historicalData) => {
  try {
    // Convert data to tensors
    const pemasukanTensor = tf.tensor(historicalData.map((data) => data.pemasukan));
    const pengeluaranTensor = tf.tensor(historicalData.map((data) => data.pengeluaran));

    // Split data into training and testing sets
    const [trainPemasukan, testPemasukan] = tf.split(pemasukanTensor, [Math.floor(pemasukanTensor.shape[0] * 0.8), pemasukanTensor.shape[0] - Math.floor(pemasukanTensor.shape[0] * 0.8)]);
    const [trainPengeluaran, testPengeluaran] = tf.split(pengeluaranTensor, [Math.floor(pengeluaranTensor.shape[0] * 0.8), pengeluaranTensor.shape[0] - Math.floor(pengeluaranTensor.shape[0] * 0.8)]);

    // Create and train the models
    const pemasukanModel = await trainModel(trainPemasukan, testPemasukan);
    const pengeluaranModel = await trainModel(trainPengeluaran, testPengeluaran);

    // Make predictions for the next month
    const predictedIncome = await pemasukanModel.predict(tf.tensor([[historicalData.length]])).dataSync()[0];
    const predictedExpense = await pengeluaranModel.predict(tf.tensor([[historicalData.length]])).dataSync()[0];

    return { predictedIncome, predictedExpense };
  } catch (error) {
    throw new Error(`Error predicting finances: ${error.message}`);
  }
};

async function trainModel(trainData, testData) {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [1] }));
  model.add(tf.layers.dense({ units: 1 }));
  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

  await model.fit(trainData, trainData, {
    epochs: 100,
    validationData: [testData, testData],
    verbose: 0,
  });

  return model;
}