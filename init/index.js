const mongoose = require('mongoose');
const initdata = require("./data");
const Lisiting = require("../models/listing");

const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust'


main().then(()=>{
    console.log("cnnected to db");
})
.catch((err)=>{
    console.log(err);
})
async function main() {
  await mongoose.connect(MONGO_URL);

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

const initDB = async() =>{
    await Lisiting.deleteMany({});
    await Lisiting.insertMany(initdata.data);
    console.log("data was initialiazed");
}

initDB();