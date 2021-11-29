const Genre = require('../mongoose/models/genreModel');
const Book = require('../mongoose/models/bookModel');
const async = require('async');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

// display list of all genres
exports.genre_list = function(req, res, next) {
    Genre.find()
        .sort([['name', 'ascending']])
        .exec(function (err, list_genres) {
            if (err) {
                return next(err);
            }
            res.render('genre_list', {title: 'List of genres', genre_list: list_genres});
        });
};
// detail page for the genre
exports.genre_detail_page = function (req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
                .exec(callback);
        },
        genre_books: function (callback) {
            Book.find({'genre': req.params.id})
                .exec(callback);
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.genre == null) {
            const err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        res.render('genre_detail_page', {title: "Genre Detail", genre: results.genre, genre_books: results.genre_books});
        });
};
// create form on GET
exports.genre_create_get = function (req, res) {
    res.render('genre_form', {title: "Create genre"});
};
// handle create form on POST
exports.genre_create_post = [
    // Validate and sanitize the name field
    body('name').trim().isLength({min: 1}).withMessage('Genre name required').escape(),
    // Process request after validation and sanitization
    (req, res, next) => {
    // Extract validation errors from a request
        let errors = validationResult(req);
        // Create a genre object with escaped and trimmed data
        const genre = new Genre(
            { name: req.body.name }
        );
        if (!errors.isEmpty()) {
            // There are errors, Render the form again with sanitized values/error messages
            res.render('genre_form', {title: "Create form", genre: genre, errors: errors.array()});
        } else {
            // Data from form is valid. Check if Genre with same name already exists
            Genre.findOne({'name': req.body.name})
                .exec(function (err, found_genre) {
                    if (err) {
                        return next(err);
                    }
                    if (found_genre) {
                        // Genre exists, redirect to its detail page
                        res.redirect(found_genre.url);
                    } else {
                        genre.save(function (err) {
                            if (err) {
                                return next(err);
                            }
                            // Genre saved. Redirect to genre detail page
                            res.redirect(genre.url);
                        });
                    }
                });
        }

    }
];
// delete form on GET
exports.genre_delete_get = function (req, res, next) {
    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id)
                .exec(callback)
        },
        books: function (callback) {
            Book.find({'genre': req.params.id})
                .exec(callback)
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.genre == null) {
            res.redirect('/catalog/genres');
        }
        res.render('genre_delete', {title: 'Delete genre', genre: results.genre, books: results.books});
    });
};
// delete form on POST
exports.genre_delete_post = function (req, res, next) {
    async.parallel({
        genre: function (callback) {
            Genre.findById(req.body.genreid)
                .exec(callback)
        },
        books: function (callback) {
            Book.find({'genre': req.body.genreid})
                .exec(callback)
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.books.length > 0) {
            res.render('genre_delete', {title: 'Delete genre', genre: results.genre, books: results.books});
        } else {
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
                if (err) {
                    return next(err);
                }
                res.redirect('/catalog/genres');
            });
        }
    });
};
// update form on GET
exports.genre_update_get = function (req, res, next) {
    Genre.findById(req.params.id)
        .exec(function (err, genre) {
            if (err) {
                return next(err);
            }
            if (genre == null) {
                res.redirect('/catalog/genres');
            }
            res.render('genre_form', {title: 'Update genre', genre: genre});
        })
};
// update on POST
exports.genre_update_post = [
    body('name', 'Genre must have a name').trim().isLength({min: 1}).escape(),
    (req, res, next) => {
        const errors = validationResult(req);
        const genre = new Genre(
            {
                name: req.body.name,
                _id: req.params.id
            }
        );
        if (!errors.isEmpty()) {
            Genre.findById(req.params.id)
                .exec(function(err) {
                    if (err) {
                        return next(err);
                    }
                    res.render('genre_form', {title: 'Update genre', genre: genre, errors: errors.array()});
                });
        } else {
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function updateGenre(err, theGenre) {
                res.redirect(theGenre.url);
            })
        }
    }
];