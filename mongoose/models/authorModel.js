const mongoose = require('mongoose');
const { DateTime } = require('luxon');

const Schema = mongoose.Schema;
const author = new Schema({
    first_name: {type: String, required: true, maxLength: 100},
    family_name: {type: String, required: true, maxLength: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date},
    stories: [{type: Schema.Types.ObjectId, ref: "Story"}]
});
author
    .virtual("name")
    .get(function () {
        return this.first_name + " " + this.family_name;
    });
author
    .virtual("lifespan")
    .get(function () {
        let lifetime_string = "";
        if (this.date_of_birth) {
            lifetime_string = DateTime.fromJSDate(this.date_of_birth).toFormat('d LLL yyyy');
        }
        lifetime_string += " - ";
        if (this.date_of_death) {
            lifetime_string += DateTime.fromJSDate(thie.date_of_death).toFormat('d LLL yyyy');
        }
        return lifetime_string;
    });
author
    .virtual("url")
    .get(function () {
        return `/catalog/author/` + this._id;
    });
author
    .virtual('date_of_birth_formatted')
    .get(function () {
        return DateTime.fromJSDate(this.date_of_birth).toFormat('d LLL yyyy');
    });
author
    .virtual('date_of_death_formatted')
    .get(function () {
        return this.date_of_death ? DateTime.fromJSDate(this.date_of_death).toFormat('d LLL yyyy') : null;
    });

module.exports = mongoose.model("Author", author);