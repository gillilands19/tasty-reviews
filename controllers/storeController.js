// middleware allows us to run code after the request and before we recieve the response.
// exports.myMiddleware = (req, res, next) => {
//   req.name = 'Sean';
//   res.cookie('name', 'sean is cool', {maxAge: 9000000});
//   next();
// };

const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    // a files mimtype will tell you what type of file it is.
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({message: `That filetype isn't allowed!`}, false);
    }
  },
};

exports.homePage = (req, res) => {
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', {title: 'Add Store'});
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if thre is no new file to resize
  if (!req.file) {
    next();
    return;
  }
  // get the files extension
  const extension = req.file.mimetype.split('/')[1];
  // assign unique identifier to photo
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written the photo to the filesystem, keep going.
  next();
};

exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save();

  req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);

  res.redirect(`/store/${store.slug}`);
};


exports.getStores = async (req, res) => {
  // query database for a list of all stores
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores });
  console.log(req.user);
};

exports.editStore = async (req, res) => {
  // find store given id
  const store = await Store.findOne({_id: req.params.id});
  // confirm they are the owner of the store

  // render out the edit form so the user can update their store. store object is passed to the view.
  // this is how we can pass store to the storeForm mixin for edit page.
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  req.body.location.type = 'Point';
  // find and update the store
  const store = await Store.findOneAndUpdate( { _id: req.params.id }, req.body, {
    new: true, // return new store instead of the old one
    runValidators: true, // force strict schema rules on update
  }).exec();
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store >> </a>`);
  res.redirect(`/stores/${store._id}/edit`);
  // redirect them to the store and tell them if worked
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug });
  if (!store) return next();
  res.render('store', { store, title: store.name });
};

exports.getStoresByTag = async (req, res, next) => {
  const tag = req.params.tag;
  console.log(req.params);
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery});
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  res.render('tag', { tags, title: 'Tags', tag, stores });
};
