const mongoose = require('mongoose');

const asalUangSchema = new mongoose.Schema({
    tipeAsalUang: {
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
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }
    
    

});

const asalUang = mongoose.model("asalUang", asalUangSchema);


module.exports = asalUang;
