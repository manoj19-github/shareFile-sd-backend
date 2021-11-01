import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import connectDB from "./dbConfig/config"
import fileRouter from "./routes/files"
import {v2 as cloudinary} from "cloudinary"

dotenv.config()
cloudinary.config({
  cloud_name:process.env.CLOUDINARY_API_CLOUD,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET,
})
connectDB()
const app=express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({
  extended:true
}))
app.get("/",(req,res)=>{
  res.status(201).json({message:"hello from santra drive have a good day"})
})
app.use("/api/file",fileRouter)
app.listen(process.env.PORT,()=>{
  console.log(`server is listening on port ${process.env.PORT}`)
})
