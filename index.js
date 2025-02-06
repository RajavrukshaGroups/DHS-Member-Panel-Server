console.log('index.js is being loaded');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
// const formRoutes = require('./Routes/form')
const conn = require('./config/config')
const MemberRoutes = require('./Routes/MemberRoutes')
const FormRouting = require('./Routes/FormRoutes')

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// Enable CORS for the specific origin
// app.use(cors({
//   origin: 'https://test.defencehousingsociety.com',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
// }));

app.use(function (request, response, next) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (request.method === 'OPTIONS') {
    return response.sendStatus(200);
  }
  next();
});

// app.use('/api', FormRouting);


app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(express.json());

app.use('/', MemberRoutes);
app.use('/api', FormRouting);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
