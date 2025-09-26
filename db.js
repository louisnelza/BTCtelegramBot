const mongoose = require('mongoose');

/**
 * Database connection and message logging utilities for the Telegram bot.
 * Updated for Mongoose 8.x compatibility with silent failure option.
 */

// Connect to the database using modern async/await pattern
const uristring = process.env.MONGO_URI || 'mongodb://localhost/botlog';
let isConnected = false;

async function connectDB() {
  try {
	await mongoose.connect(uristring);
	console.log('Successfully connected to: ' + uristring);
	isConnected = true;
  } catch (err) {
	console.warn('Warning: Could not connect to database: ' + uristring + '. ' + err.message);
	console.warn('Application will continue without database functionality.');
	isConnected = false;
	// Don't exit the process - just log the warning
  }
}

// Initialize connection
connectDB();

// Define the schema for messages
const messageSchema = new mongoose.Schema({
  user: {
	name: String,
	id: Number
  },
  message: {
	chat_id: String,
	id: String,
	text: String
  },
  timestamp: {
	type: Date,
	default: Date.now
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Define the model for messages
const Message = mongoose.model('Messages', messageSchema);

/**
 * Check if database is connected
 * @returns {boolean} Connection status
 */
function isDatabaseConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Retrieve all logs from the database
 * @returns {Promise<Array>} Array of message documents or empty array if not connected
 */
async function getLogs() {
  if (!isDatabaseConnected()) {
	console.warn('Database not connected. Returning empty array.');
	return [];
  }
  
  try {
	const result = await Message.find({}).exec();
	return result;
  } catch (err) {
	console.error('Error retrieving logs:', err);
	return [];
  }
}

/**
 * Delete all logs from the database
 * @returns {Promise<Object>} Delete operation result or null if not connected
 */
async function clearLogs() {
  if (!isDatabaseConnected()) {
	console.warn('Database not connected. Cannot clear logs.');
	return null;
  }
  
  try {
	const result = await Message.deleteMany({});
	console.log(`Cleared ${result.deletedCount} messages`);
	return result;
  } catch (err) {
	console.error('Error clearing logs:', err);
	return null;
  }
}

/**
 * Add a log entry to the database
 * @param {Object} user - User object with name and id
 * @param {Object} message - Message object with chat_id, id, and text
 * @returns {Promise<Object|null>} Saved message document or null if not connected
 */
async function addLog(user, message) {
  if (!isDatabaseConnected()) {
	console.warn('Database not connected. Log entry not saved:', { user: user.name, message: message.text });
	return null;
  }
  
  try {
	const dbmsg = new Message({
	  user: user,
	  message: message,
	  timestamp: new Date()
	});
	const result = await dbmsg.save();
	return result;
  } catch (err) {
	console.error('Error adding log:', err);
	return null;
  }
}

/**
 * Get logs with pagination and filtering options
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of results
 * @param {number} options.skip - Number of results to skip
 * @param {Object} options.filter - Filter criteria
 * @returns {Promise<Array>} Array of filtered message documents or empty array if not connected
 */
async function getLogsWithOptions(options = {}) {
  if (!isDatabaseConnected()) {
	console.warn('Database not connected. Returning empty array.');
	return [];
  }
  
  try {
	const { limit = 100, skip = 0, filter = {} } = options;
	const result = await Message.find(filter)
	  .limit(limit)
	  .skip(skip)
	  .sort({ timestamp: -1 })
	  .exec();
	return result;
  } catch (err) {
	console.error('Error retrieving logs with options:', err);
	return [];
  }
}

/**
 * Get logs count
 * @param {Object} filter - Filter criteria
 * @returns {Promise<number>} Number of matching documents or 0 if not connected
 */
async function getLogsCount(filter = {}) {
  if (!isDatabaseConnected()) {
	console.warn('Database not connected. Returning count of 0.');
	return 0;
  }
  
  try {
	const count = await Message.countDocuments(filter);
	return count;
  } catch (err) {
	console.error('Error counting logs:', err);
	return 0;
  }
}

// Handle graceful shutdown (only if connected)
process.on('SIGINT', async () => {
  try {
	if (isDatabaseConnected()) {
	  await mongoose.connection.close();
	  console.log('MongoDB connection closed.');
	}
	process.exit(0);
  } catch (err) {
	console.error('Error closing MongoDB connection:', err);
	process.exit(1);
  }
});

// Export the functions
module.exports = {
  getLogs,
  clearLogs,
  addLog,
  getLogsWithOptions,
  getLogsCount,
  isDatabaseConnected,
  Message // Export model for advanced queries if needed
};