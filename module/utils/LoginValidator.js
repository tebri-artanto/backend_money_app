const Joi = require("joi");

const LoginValidator = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().min(1).max(255).required(),
    fcmToken: Joi.string().optional(),
});

module.exports = LoginValidator;
