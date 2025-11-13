const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const blockchainService = require('./services/blockchainService');
const ipfsService = require('./services/ipfsService');
const evidenceRoutes = require('./routes/evidenceRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Digital Evidence API is running',
    timestamp: new Date().toISOString(),
  });
});

// Evidence routes
app.use('/api/evidences', evidenceRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initializeServices() {
  console.log('\n🚀 Initializing Digital Evidence Backend...\n');

  try {
    // Initialize IPFS
    await ipfsService.initialize();

    // Initialize blockchain
    await blockchainService.initialize();

    console.log('\n✅ All services initialized successfully\n');
    return true;
  } catch (error) {
    console.error('\n❌ Service initialization failed:', error.message);
    console.error('\nPlease ensure:');
    console.error('  1. IPFS daemon is running (ipfs daemon)');
    console.error('  2. Blockchain node is running (e.g., Ganache, Hardhat)');
    console.error('  3. Environment variables are configured (.env file)\n');
    return false;
  }
}

// ============================================================================
// START SERVER
// ============================================================================

async function start() {
  const initialized = await initializeServices();

  if (!initialized) {
    console.error('❌ Cannot start server without services initialized');
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log('='.repeat(60));
    console.log(`🚀 Digital Evidence API Server`);
    console.log('='.repeat(60));
    console.log(`📡 Server: http://localhost:${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`🔗 Blockchain: ${config.blockchain.rpcUrl}`);
    console.log(`📦 IPFS: ${config.ipfs.protocol}://${config.ipfs.host}:${config.ipfs.port}`);
    console.log('='.repeat(60));
    console.log('\n✅ Server is ready to accept requests\n');
  });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM signal received: closing server gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT signal received: closing server gracefully');
  process.exit(0);
});

// Start the server
start();

module.exports = app;
