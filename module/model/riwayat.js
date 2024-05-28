const mongoose = require('mongoose');

const RiwayatSchema = new mongoose.Schema({
    tanggal: {
        type: Date,
        // required: true,
    },
    tipe: {
        type: String,
        // required: true,
    },
    nominal: {
        type: Number,
        // required: true,
    },
    catatan: {
        type: String,
        // required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    asalUang: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'asalUang' } // Referencing the activities model
    ],
    kategori: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'kategori' } 
    ],
    nota: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'nota' } 
    ],
    
    bulan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bulan",
    }
    

});

const Riwayat = mongoose.model("Riwayat", RiwayatSchema);


module.exports = Riwayat;
