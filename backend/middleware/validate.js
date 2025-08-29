const Joi = require('joi');

function validateBody(schema) {
    return function (req, res, next) {
        const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            return res.status(400).json({
                message: 'Validation failed',
                details: error.details.map(d => d.message)
            });
        }
        req.body = value;
        next();
    };
}

const callRatingSchema = Joi.object({
    sessionId: Joi.string().required(),
    peerId: Joi.string().required(),
    rating: Joi.number().integer().min(1).max(10).required(),
    feedback: Joi.string().max(500).optional(),
    callDuration: Joi.number().min(0).optional(),
    callQuality: Joi.string().valid('Excellent', 'Good', 'Fair', 'Poor').optional(),
    issues: Joi.array().items(Joi.string().valid('Audio Issues', 'Video Issues', 'Connection Problems', 'Lag', 'None')).optional()
});

function validateCallRating(req, res, next) {
    const { error, value } = callRatingSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map(d => d.message)
        });
    }
    req.body = value;
    next();
}

module.exports = {
    validateBody,
    Joi,
    validateCallRating
};