let mongoose = require("mongoose");

let categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  blocked: {
    type: Number,
    default: 0,
  },
});

let category = mongoose.model("category", categorySchema);
module.exports = category;
