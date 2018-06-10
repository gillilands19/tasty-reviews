const mongoose = require('mongoose');
// set mongoose promise property to global so that mongoose uses es6 promises
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
name: {
  type: String,
  trim: true,
  required: 'Please enter a store name!',
},
slug: String,
description: {
  type: String,
  trim: true,
},
tags: [String],
created: {
  type: Date,
  default: Date.now,
},
location: {
  type: {
    type: String,
    default: 'Point',
  },
  coordinates: [{
    type: Number,
    required: 'You must supply coordinates!',
  }],
  address: {
    type: String,
    required: 'You must supply an address!',
  },
},
photo: String,
});

// has to use 'function' syntax because we are using 'this' keyword
// 'this' does not bind to es6 arrow functions
storeSchema.pre('save', async function(next) {
  if (!this.isModified()) {
    next();
    return;
  }
  this.slug = slug(this.name);

  // find other stores that have a same slug
  const slugRegex = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');

  const storesWithSlug = await this.constructor.find({slug: slugRegex});

  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  };

  next();
  // TODO make more resiliant so slugs are unique
});

storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    // unwind returns as many instances of a restaurant equal
    // to the amount of tags it has
    {$unwind: '$tags'},
    {$group: {_id: '$tags', count: {$sum: 1}}},
    {$sort: {count: -1}},
  ]);
};


module.exports = mongoose.model('Store', storeSchema);
