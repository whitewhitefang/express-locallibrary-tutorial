const Book = require('../mongoose/models/bookModel');
const Author = require('../mongoose/models/authorModel');
const BookInstance = require('../mongoose/models/bookInstanceModel');
const Genre = require('../mongoose/models/genreModel');
const async = require('async');
const { body, validationResult } = require('express-validator');

exports.index = function (req, res) {
    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback);
        },
        book_instance_count: function (callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({status: "Available"}, callback);
        },
        author_count: function (callback) {
            Author.countDocuments({}, callback);
        },
        genre_count: function (callback) {
            Genre.countDocuments({}, callback);
        }
    },
        function (err, results) {
            res.render("index", {title: "Local library home", error: err, data: results});
    });
};

// display list of all books
exports.book_list = function(req, res, next) {
    Book.find({}, 'title author')
        .sort({title: 1})
        .populate('author')
        .exec(function (err, list_books) {
            if (err) {
                return next(err);
            }
            res.render('book_list', {title: 'Book list', book_list: list_books});
        });
};
// detail page for the book
exports.book_detail_page = function (req, res, next) {
    async.parallel({
        book: function (callback) {
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback);
        },
        book_instance: function (callback) {
            BookInstance.find({'book': req.params.id})
                .exec(callback);
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.book == null) {
            const err = new Error("Book not found");
            err.status = 404;
            return next(err);
        }
        res.render('book_detail_page', {title: results.book.title, book: results.book, book_instance: results.book_instance});
    });
};
// create form on GET
exports.book_create_get = function (req, res, next) {
    // Gat all authors and genres, which we can use for adding to our book
    async.parallel({
        authors: function (callback) {
            Author.find(callback);
        },
        genres: function (callback) {
            Genre.find(callback);
        }
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        res.render('book_form', {title: 'Create a book', authors: results.authors, genres: results.genres});
    });
};
// handle create form on POST
exports.book_create_post = [
    // Convert the genre to an array
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined') {
                req.body.genre = [];
            } else {
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },
    // Validate and sanitize fields
    body('title', 'Title must not be empty').trim().isLength({min: 1}). escape(),
    body('author', 'Author must not be empty').trim().isLength({min: 1}).escape(),
    body('summary', 'Summary must not be empty').trim().isLength({min: 1}).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({min: 1}).escape(),
    body('genre.*').escape(),
    // Process request after validation and sanitization
    (req, res, next) => {
        // Extract the validation errors
        const errors = validationResult(req);
        // Create a book object
        const book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: req.body.genre
            }
        );
        if (!errors.isEmpty()) {
            // There are errors... Render form again
            // Get all authors and genres for form
            async.parallel({
                authors: function (callback) {
                    Author.find(callback);
                },
                genres: function (callback) {
                    Genre.find(callback);
                },
            }, function (err, results) {
                if (err) {
                    return next(err);
                }
                // Mark our selected genres like genre
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true'
                    }
                }
                res.render('book_form', {title: 'Create book', authors: results.authors, genres: results.genres, book: book, errors: errors.array()});
            });
        } else {
            // Data is valid, save new book
            book.save(function (err) {
                if (err) {
                    return next(err);
                }
                res.redirect(book.url);
            });
        }
    }
];
// delete form on GET
exports.book_delete_get = function (req, res, next) {
    async.parallel({
        book: function (callback) {
            Book.findById(req.params.id)
                .exec(callback)
        },
        bookInstances: function (callback) {
            BookInstance.find({'book': req.params.id})
                .exec(callback)
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.book == null) {
            res.redirect('/catalog/books');
        }
        res.render('book_delete', {title: 'Delete book', book: results.book, bookInstances: results.bookInstances});
    });
};
// delete create form on POST
exports.book_delete_post = function (req, res, next) {
    async.parallel({
        book: function (callback) {
            Book.findById(req.body.bookid)
                .exec(callback)
        },
        bookInstances: function (callback) {
            BookInstance.find({'book': req.body.bookid})
                .exec(callback)
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.bookInstances.length > 0) {
            res.render('book_delete', {title: 'Delete book', book: results.book, bookInstances: results.bookInstances});
        } else {
            Book.findByIdAndRemove(req.body.bookid, function deleteBook(err) {
                if (err) {
                    return next(err);
                }
                res.redirect('/catalog/books');
            });
        }
    });
};
// update form on GET
exports.book_update_get = function (req, res, next) {
    // Get book, authors and genres from form
    async.parallel({
        book: function (callback) {
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback)
        },
        authors: function (callback) {
            Author.find(callback)
        },
        genres: function (callback) {
            Genre.find(callback)
        }
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.book == null) {
            const err = new Error('No book was found');
            res.status = 404;
            return next(err);
        }
        // Success. Mark our selected genres as checked
        for (let all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
            for (let book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                if (results.genres[all_g_iter]._id.toString() === results.book.genre[book_g_iter]._id.toString()) {
                    results.genres[all_g_iter].checked = 'true';
                }
            }
        }
        res.render('book_form', {title: 'Update book', authors: results.authors, genres: results.genres, book: results.book});
    })
};
// update form on POST
exports.book_update_post = [
    // At first convert the genre to an array
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined') {
                req.body.genre = [];
            } else {
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },
    // Validate, sanitize...
    body('title', 'Title must not be empty').trim().isLength({min: 1}).escape(),
    body('author', 'Author must not be empty').trim().isLength({min: 1}).escape(),
    body('summary', 'Summary must not be empty').trim().isLength({min: 1}).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({min: 1}).escape(),
    body('genre.*').escape(),
    // Process request
    (req, res, next) => {
        const errors = validationResult(req);
        // Create a book object
        const book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: (typeof req.body.genre === 'undefined' ? [] : req.body.genre),
                _id: req.params.id // Or new _id will be assigned
            }
        );
        if (!errors.isEmpty()) {
        // There are errors, re-render form with errors messages
        // Get all authors and genres for form again
            async.parallel({
                authors: function (callback) {
                    Author.find(callback)
                },
                genres: function (callback) {
                    Genre.find(callback)
                }
            }, function (err, results) {
                if (err) {
                    return next(err);
                }
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }
                }
                res.render('book_form', {title: 'Update book', authors: results.authors, genres: results.genres, book: results.book, errors: results.errors.array()});
            });
        } else {
        // Data is valid, update record
            Book.findByIdAndUpdate(req.params.id, book, {}, function (err, thebook) {
                if (err) {
                    return next(err);
                }
                res.redirect(thebook.url);
            });
        }
    }
];