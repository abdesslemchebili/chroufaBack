require('dotenv').config();

module.exports = {
  mongoURI: process.env.MONGO_URI || 'mongodb+srv://abdesslemchebili:kylVj8hhASQ0Pk6v@pool-maintenance.k6ji64u.mongodb.net/',
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || '9b967667fc011a8843f04074156412a7e9d716a87958c5e37994e6f48617750a',
  jwtExpiration: process.env.JWT_EXPIRATION || '30d',
  encryptionKey: process.env.ENCRYPTION_KEY || '47dfbebc5d7655c27c439e5e240a9f260f748da85b867050180c8f81a74a917b'
};


