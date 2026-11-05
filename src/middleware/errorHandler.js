function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  if (err.message.includes('SQLITE_CONSTRAINT')) {
    return res.status(400).json({ error: 'Duplicate entry or constraint violation' });
  }
  
  if (err.message.includes('File too large')) {
    return res.status(413).json({ error: 'File too large' });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
}

module.exports = {
  errorHandler
};
