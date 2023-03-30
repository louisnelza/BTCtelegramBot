const mongoose = require('mongoose');

// connect to the database
const uristring = 'mongodb://localhost/botlog';
mongoose.connect(uristring, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, res) {
	if (err) {
		console.log('Error connecting to: ' + uristring + '. ' + err);
	} else {
		console.log('Succeeded connected to: ' + uristring);
	}
});

// define the schema for messages
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
	timestamp: String
});

// define the model for messages
const Message = mongoose.model('Messages', messageSchema);

// function to retrieve all logs from the database
function getLogs(cb) {
	Message.find({}).exec(function (err, result) {
		cb(result);
	});
}

// function to delete all logs from the database
function clearLogs(cb) {
	Message.remove({}, cb);
}

// function to add a log to the database
function addLog(user, message, cb) {
	const dbmsg = new Message({
		user: user,
		message: message,
		timestamp: new Date().toISOString()
	});
	dbmsg.save(cb);
}

// export the functions
module.exports = {
	getLogs,
	clearLogs,
	addLog
};
