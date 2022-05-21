const mongoose = require('mongoose');
const { Schema } = mongoose;
// const ObjectId = mongoose.Schema.Types.ObjectId;

const User = new Schema({
  email: String,
  role: [{ type: String }],
  password: String,
  tokenResetPassword: String,
}, {
  versionKey: false // You should be aware of the outcome after set to false
});

const model = mongoose.model('User', User);
User.index({email: 1});

module.exports = model;