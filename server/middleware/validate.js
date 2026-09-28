/**
 * Validates request parts against Zod schemas and exposes the parsed (typed, stripped) values
 * on `req.validated`. Unknown keys are dropped, so controllers never see unexpected fields.
 * A ZodError thrown here is turned into a 400 response by the error handler.
 */
const validate = ({ body, params, query } = {}) => (req, res, next) => {
  req.validated = {
    body: body ? body.parse(req.body ?? {}) : undefined,
    params: params ? params.parse(req.params) : req.params,
    query: query ? query.parse(req.query) : undefined,
  };
  next();
};

module.exports = validate;
