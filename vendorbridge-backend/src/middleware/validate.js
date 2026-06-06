// Zod validation middleware
exports.validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      console.error('Validation error:', error);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors?.map(e => ({ path: e.path.join('.'), message: e.message })) || error.message 
      });
    }
  };
};
