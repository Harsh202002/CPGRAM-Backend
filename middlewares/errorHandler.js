exports.errorHandler = (err, req, res, next) => {
    console.error(err.stack);
   const statusCode = res.statusCode ? res.statusCode : 500; // Set default status code to 500 if not set
   res.status(statusCode).json({
         success: false,
         message: err.message || 'Internal Server Error',
         stack: process.env.NODE_ENV === 'production' ? null : err.stack // Hide stack trace in production
    });
}