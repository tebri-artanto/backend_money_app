const mongoose = require('mongoose');
const Riwayat = require('./riwayat');
const { Schema, model } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    createDate: {
        type: Date,
        default: Date.now
    }, 
    bulan: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Bulan' } // Referencing the activities model
    ],
    kategori: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Kategori' } // Referencing the activities model
    ],
    asalUang: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'AsalUang' } // Referencing the activities model
    ],
});

const User = model('User', userSchema);

module.exports = User;
