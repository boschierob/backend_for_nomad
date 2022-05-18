const mongoose = require('mongoose');

const connectionsString = process.env.MONGO_URL || "mongodb://localhost/yem-bqckend";

mongoose.connect(connectionsString, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
});

var db = mongoose.connection;
db.on('error', function (e) {
    console.log('bad to MongoDB', e);
});
db.once('open', function () {
    console.log('Connected to MongoDB');
});

mongoose.Promise = global.Promise;

module.exports = {
    User: require('./../models/user.js'),
};
