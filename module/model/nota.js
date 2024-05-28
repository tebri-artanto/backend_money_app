const mongoose = require('mongoose');

const notaSchema = new mongoose.Schema({
    imagePath: {
        type: String,
        // required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    riwayat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "riwayat",
    },
    

});

const nota = mongoose.model("nota", notaSchema);


module.exports = nota;
