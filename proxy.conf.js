const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';

module.exports = {
  '/api': {
    target: backendUrl,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
  },
};
