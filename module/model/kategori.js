const mongoose = require('mongoose');

const kategoriSchema = new mongoose.Schema({
    namaKategori: {
        type: String,
        // required: true,
    },
    // subKategori: {
    //     type: String,
    //     // required: true,
    // },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    riwayat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "riwayat",
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    } 
    

});

const kategori = mongoose.model("kategori", kategoriSchema);


module.exports = kategori;
