const Author = require('../mongoose/models/authorModel');
const Book = require('../mongoose/models/bookModel');
const async = require('async');
const { body, validationResult } = require('express-validator');

// list of all authors
exports.author_list = function (req, res, next) {
    Author.find()
        .sort([['family_name', 'ascending']])
        .exec(function (err, list_authors) {
            if (err) {
                return next(err);
            }
            res.render('author_list', {title: 'Author list', author_list: list_authors});
        });
};
// detail page for the Author
exports.author_detail = function (req, res, next) {
    async.parallel({
        author: function (callback) {
            Author.findById(req.params.id)
                .exec(callback)
        },
        authors_books: function (callback) {
            Book.find({"author": req.params.id}, 'title summary')
                .exec(callback)
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.author==null) {
            const err = new Error("Author not found");
            err.status = 404;
            return next(err);
        }
        res.render('author_detail', {title: "Author detail", author: results.author, author_books: results.authors_books})
        });
};
// display Author create form on GET
exports.author_create_get = function (req, res, next) {
    res.render('author_form', {title: 'Create author'});
};
// Handle Author create on POST
exports.author_create_post = [
    body('first_name').trim().isLength({min: 1}).escape().withMessage('First name must be specified').isAlphanumeric().withMessage('First name has non-alphanumeric characters'),
    body('family_name').trim().isLength({min: 1}).escape().withMessage('Family name must be specified').isAlphanumeric().withMessage('Family name has non-alphanumeric characters'),
    body('date_of_birth', 'Invalid date of birth').optional({checkFalsy: 'true'}).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({checkFalsy: 'true'}).isISO8601().toDate(),
    // Process request after validation and sanitization
    (req, res, next) => {
        // Extract validation errors from the request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // There are errors/ Re-render the form
            res.render('author_form', {title: 'Create author', author: req.body, errors: errors.array()});
        } else {
            // Data form is valid
            // Create an author object with escaped and trimmed data
            const author = new Author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
                }
            );
            author.save(function (err) {
                if (err) {
                    return next(err);
                }
                res.redirect(author.url);
            });
        }
    },
];
// display Author delete form on GET
exports.author_delete_get = function (req, res, next) {
    async.parallel({
        author: function (callback) {
            Author.findById(req.params.id)
                .exec(callback)
        },
        authors_books: function (callback) {
            Book.find({'author': req.params.id})
                .exec(callback)
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.author == null) {
            res.redirect('/catalog/authors');
        }
        res.render('author_delete', {title: 'Delete author', author: results.author, author_books: results.authors_books});
    });
};
// handle Author delete on POST
exports.author_delete_post = function (req, res, next) {
    async.parallel({
        author: function (callback) {
            Author.findById(req.body.authorid)
                .exec(callback)
        },
        authors_books: function (callback) {
            Book.find({'author': req.body.authorid})
                .exec(callback)
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.authors_books.length > 0) {
            // Author has books. Render in some way as for GET route
            res.render('author_delete', {title: 'Delete author', author: results.author, author_books: results.authors_books});
        } else {
            // Author has no books. Delete object and redirect to the authors list
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if (err) {
                    return next(err);
                }
                res.redirect('/catalog/authors');
            });
        }
    });
};
// display Author update form on GET
exports.author_update_get = function (req, res, next) {
    async.parallel({
        author: function (callback) {
            Author.findById(req.params.id)
                .exec(callback)
        },
        books: function (callback) {
            Book.find({'author': req.params.id}, 'title, summary')
                .exec(callback)
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.author == null) {
            const err = new Error('No author was found');
            err.status = 404;
            return next(err);
        }
        res.render('author_form', {title: 'Update author', author: results.author, author_books: results.books});
    });
};
// handle Author update on POST
exports.author_update_post = [
    body('first_name').trim().isLength({min: 1}).escape().withMessage('First name must be specified').isAlphanumeric().withMessage('First name has non-alphanumeric characters'),
    body('family_name').trim().isLength({min: 1}).escape().withMessage('Family name must be specified').isAlphanumeric().withMessage('Family name has non-alphanumeric characters'),
    body('date_of_birth', 'Invalid date of birth').optional({checkFalsy: 'true'}).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of death').optional({checkFalsy: 'true'}).isISO8601().toDate(),
    (req, res, next) => {
        const errors = validationResult(req);
        const author = new Author(
            {
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death,
                _id: req.params.id
            }
        );
        if (!errors.isEmpty()) {
            Book.find({}, 'title, summary')
                .exec(function (err, books) {
                    if (err) {
                        return next(err);
                    }
                    res.render('author_form', {title: 'Update author', author: req.body, author_books: books});
                });
        } else {
            Author.findByIdAndUpdate(req.params.id, author, {}, function updateAuthor(err, theauthor) {
                if (err) {
                    return next(err);
                }
                res.redirect(theauthor.url);
            });
        }
    }
];