const PredictionService = require('../service/PredictionService');

const predictNextMonthFinances = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    // Prepare data
    const data = await PredictionService.prepareData(userId);

    // Make prediction
    const predictions = await PredictionService.predict(userId, data);

    // Calculate total predicted expense
    const predictedExpense = Object.values(predictions).reduce((sum, value) => sum + value, 0);

    // You might want to implement a similar process for income prediction
    // For now, we'll use a placeholder value
    const predictedIncome = 5000000; // placeholder value

    const predictedBalance = predictedIncome - predictedExpense;

    res.json({
      predictedIncome: Math.round(predictedIncome),
      predictedExpense: Math.round(predictedExpense),
      predictedBalance: Math.round(predictedBalance),
      categoryPredictions: Object.fromEntries(
        Object.entries(predictions).map(([category, value]) => [category, Math.round(value)])
      )
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: 'An error occurred while generating predictions' });
  }
};

module.exports = {
  predictNextMonthFinances,
};
