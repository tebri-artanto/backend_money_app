const Joi = require("joi");

const DPAValidator = Joi.object({
    originalname: Joi.required(),
    buffer: Joi.required(),
    mimeType: Joi.required(),
});

module.exports = DPAValidator;
