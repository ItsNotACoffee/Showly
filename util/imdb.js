const imdb = require('imdb-api');
const imdbHandler = new imdb.Client({apiKey: `${process.env.IMDB_APIKEY}`});

module.exports = imdbHandler;