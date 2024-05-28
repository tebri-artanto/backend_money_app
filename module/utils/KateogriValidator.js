const Joi = require("joi");

const KategoriValidator = Joi.object({
    namaKategori: Joi.string().required(),
});

module.exports = KategoriValidator;
