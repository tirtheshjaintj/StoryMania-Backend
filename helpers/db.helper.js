const mongoose=require("mongoose");


async function connectDB(){ 
try {
const {connection}=await mongoose.connect(process.env.MONGODB_URL);
console.log(`MongoDB is connected ${connection.host}`);
} catch (error) {
    console.error(error.message);   
}
}

module.exports=connectDB;