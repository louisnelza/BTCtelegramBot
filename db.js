const mongoose = require('mongoose');

const uristring = 'mongodb://localhost/botlog';

mongoose.connect(uristring, function(err, res) {
	if(err) {
		console.log('Error connecting to: '+ uristring + '. ' +err);
	} else {
		console.log('Succeeded connected to: '+ uristring);
	}
});

// Schema
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

// Model
const Message = mongoose.model('Messages', messageSchema);

module.exports = {
	getLogs(cb) {
		Message.find({}).exec(function (err, result) {
			cb(result);
		})
	},

	clearLogs(cb) {
		Message.remove({}, cb);
	},

	addLog(user, message, cb) {
		dbmsg = new Message({
			user: user,
			message: message,
			timestamp: new Date().toISOString()
		}).save(cb);
	}
}
