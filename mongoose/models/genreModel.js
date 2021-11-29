const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const genre = new Schema({
    name: {type: String, required: true, minLength: 3, maxLength: 100}
});
genre
    .virtual("url")
    .get(function () {
        return "/catalog/genre/" + this._id;
    });

module.exports = mongoose.model("Genre", genre);