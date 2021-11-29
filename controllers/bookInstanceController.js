const BookInstance = require('../mongoose/models/bookInstanceModel');
const { body, validationResult } = require('express-validator');
const Book = require('../mongoose/models/bookModel');
const async = require('async');

// display list of all booksInstances
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find()
        .populate('book')
        .exec(function (err, list_bookinstances) {
            if (err) {
                return next(err);
            }
            res.render('bookinstance_list', {title: 'Book instance list', bookinstance_list: list_bookinstances});
        });
};
// detail page for the bookinstance
exports.bookinstance_detail_page = function (req, res, next) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function(err, bookinstance) {
            if (err) {
                return next(err);
            }
            if (bookinstance == null) {
                const err = new Error('Book copy not found');
                err.status = 404;
                return next(err);
            }
            res.render('bookinstance_detail_page', {title: "Copy: " + bookinstance.book.title, bookinstance: bookinstance});
        });
};
// create form on GET
exports.bookinstance_create_get = function (req, res, next) {
    Book.find({}, 'title')
        .exec(function (err, books) {
            if (err) {
                return next(err);
            }
            res.render('bookinstance_form', {title: 'Create book instance', book_list: books});
        });
};
// handle create form on POST
exports.bookinstance_create_post = [
    // Validate and sanitize...
    body('book', 'Book must be specified').trim().isLength({min: 1}).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({min: 1}).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601().toDate(),
    // Process request...
    (req, res, next) => {
        const errors = validationResult(req);
        // Create bookinstance object
        const bookInstance = new BookInstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back
            }
        );
        if (!errors.isEmpty()) {
            // Some errors, rerender form with errors messages
            Book.find({}, 'title')
                .exec(function (err, books) {
                    if (err) {
                        return next(err);
                    }
                    res.render('bookinstance_form', {title: 'Create book instance', book_list: books, selected_book: bookInstance.book._id, errors: errors.array(), bookinstance: bookInstance});
                });
        } else {
            // Data is valid, save it
            bookInstance.save(function (err, results) {
                if (err) {
                    return next(err);
                }
                res.redirect(bookInstance.url);
            });
        }
    }
];
// delete form on GET
exports.bookinstance_delete_get = function (req, res, next) {
       BookInstance.findById(req.params.id)
           .populate('book')
           .exec(function(err, bookInstance) {
               if (err) {
                   return next(err);
               }
               if (bookInstance == null) {
                   res.redirect('/catalog/bookinstances');
               }
               res.render('bookinstance_delete', {title: 'Delete book instance', bookInstance: bookInstance, book: bookInstance.book});
           });
};
// delete form on POST
exports.bookinstance_delete_post = function (req, res, next) {
    BookInstance.findById(req.body.bookinstanceid)
        .populate('book')
        .exec(function (err) {
            if (err) {
                return next(err);
            } else {
            BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteBookinstance(err) {
                if (err) {
                    return next(err);
                }
                res.redirect('/catalog/bookinstances');
            });
        }
    });
};
// update form on GET
exports.bookinstance_update_get = function (req, res, next) {
    async.parallel({
        bookinstance: function (callback) {
            BookInstance.findById(req.params.id)
                .populate('book')
                .exec(callback)
        },
        books: function (callback) {
            Book.find(callback)
        },
    }, function (err, results) {
        if (err) {
            return next(err);
        }
        if (results.bookinstance == null) {
            const err = new Error("No book instances were found");
            err.status = 404;
            return next(err);
        }
        res.render('bookinstance_form', {title: 'Update book', bookinstance: results.bookinstance, book_list: results.books, selected_book: results.bookinstance.book._id});
    });
};
// update on POST
exports.bookinstance_update_post = [
    body('book', 'Book must be specified').trim().isLength({min: 1}).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({min: 1}).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601().toDate(),
    (req, res, next) => {
        const errors = validationResult(req);
        const bookInstance = new BookInstance(
            {
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back,
                _id: req.params.id
            }
        );
        if (!errors.isEmpty()) {
            Book.find({}, 'title')
                .exec(function(err, books) {
                    if (err) {
                        return next(err);
                    }
                    res.render('bookinstance_form', {title: 'Update book instance', book_list: books, selected_book: bookInstance.book._id, errors: errors.array(), bookinstance: bookInstance});
                });
        } else {
            BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {}, function updateBookinstance(err, thebookinstance) {
                if (err) {
                    return next(err);
                }
                res.redirect(thebookinstance.url);
            });
        }
    }
];