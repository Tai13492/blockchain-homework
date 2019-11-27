const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  WEB3_PROVIDER: process.env.WEB3_PROVIDER,
  HASH_SECRET: process.env.HASH_SECRET,
  PRIVATE_KEY: process.env.PRIVATE_KEY
};
