const Joi = require("joi");

const riwayatValidator = Joi.object({
    tanggal: Joi.date().required(),
    asalUangId: Joi.number().required(),
    tipe: Joi.string().required(),
    kategoriId: Joi.number().required(),
    nominal: Joi.number().required(),
    catatan: Joi.string(),
    userId: Joi.number().required(),
    
});

module.exports = riwayatValidator;
