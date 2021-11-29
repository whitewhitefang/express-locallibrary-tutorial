const mongoose = require("mongoose");
const { DateTime } = require('luxon');

const Schema = mongoose.Schema;
const bookInstance = new Schema({
    book: {type: Schema.Types.ObjectId, ref: "Book", required: true},
    imprint: {type: String, required: true},
    status: {type: String, required: true, enum: ["Available", "Maintenance", "Loaned", "Reserved"], default: "Maintenance"},
    due_back: {type: Date, default: Date.now}
});
bookInstance
    .virtual("url")
    .get(function () {
        return `/catalog/bookinstance/` + this._id;
    });
bookInstance
    .virtual("due_back_formatted")
    .get(function () {
        return DateTime.fromJSDate(this.due_back).toFormat('d LLL yyyy');
    });

module.exports = mongoose.model("bookInstanceModel", bookInstance);