import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config()
const connectDB=async()=>{
  try{
    await mongoose.connect(process.env.DB_URL!,{
      // useCreateIndex:true,
      // useNewUrlParser:true,
      // useFindAndModify:true,
      // useUnifiedTopology:true,
    });

  }catch(error){
    console.log(`database connection error `,error)

  }

  const connection=mongoose.connection
  if(connection.readyState>=1){
    console.log(`connected to database successfully`)
    return;
  }
  connection.on("error",()=>console.log(`connection failed `))
}
export default connectDB
