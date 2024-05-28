const mongoose = require("mongoose");

const connectDb = async () => {
  const connectionString = "mongodb+srv://tebriartanto:MSwSkPM1xXM5uNUC@cluster0.whboy2t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

  await mongoose
    .connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true, // To suppress another deprecation warning
    })
    .then(() => console.log("Database Connected"))
    .catch((error) => console.log("Database Connection Error:", error.message));
};

connectDb();
