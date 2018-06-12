const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: 'Please supply a name',
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid Email Address'],
    required: 'Please supply an email address!',
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

userSchema.virtual('gravatar').get(function() {
  const hash = md5(this.email);
  return `https://gravatar.com/avatar/${hash}?s=200`;
});

userSchema.plugin(passportLocalMongoose, {
  usernameField: 'email',
  saltlen: 64,
  digestAlgorithm: 'sha512',
  limitAttempts: true,
  maxAttempts: 5,
});
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);
