// Configuration for different environments
const config = {
  development: {
    API_BASE_URL: 'http://localhost:5000/api/v1'
  },
  production: {
    API_BASE_URL: '/.netlify/functions/server/api/v1'
  }
};

const currentConfig = config[process.env.NODE_ENV] || config.development;

export default currentConfig;
