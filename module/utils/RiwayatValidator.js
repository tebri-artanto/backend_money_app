const Joi = require("joi");

const riwayatValidator = Joi.object({
    tanggal: Joi.date().required(),
    asalUang: Joi.string().required(),
    tipe: Joi.string().required(),
    kategori: Joi.string().required(),
    nominal: Joi.number().required(),
    deskripsi: Joi.string().required(),
    owner: Joi.string().required(),
});

module.exports = riwayatValidator;
