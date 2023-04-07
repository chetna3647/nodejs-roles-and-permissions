const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cookieparser = require('cookie-parser');
const multer = require('multer');
const cors = require('cors');
const conn = require('./dbConnection');
const userRoute = require('./routes/user-routes');
const categoriesRoute = require('./routes/categories-routes');
const productRoute = require('./routes/product-routes');

dotenv.config({ path: './.env' });

const port = process.env.PORT;

const app = express();

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  
    next();
});

app.use(cors()); //enable cors
app.use(express.urlencoded({ extended: false }));  // parse application/x-www-form-urlencoded
app.use(express.json());
app.use(cookieparser());

//Configuration for Multer
const upload = multer({ dest: "public/images" });
module.exports = upload;

//use express static folder
app.use(express.static('public')); 
app.use('/images', express.static('images'));

//set view fle
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); //set view engine

app.use('/', userRoute); //user
app.use('/categories', categoriesRoute); //categories
app.use('/products', productRoute); //products

app.listen(port, () => {
    console.log(`Server running at ${port}`);
});