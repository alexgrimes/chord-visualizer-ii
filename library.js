// This file loads the new rhythmic library for the app
// and exports it for use in your frontend code.

// If you use ES modules:
// import library from './library-builder/output/curated-library-rhythmic.json';

// If you use CommonJS (Node):
const library = require('./library-builder/output/curated-library-rhythmic.json');

module.exports = library;
