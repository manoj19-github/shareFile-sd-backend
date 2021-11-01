import express from "express"
import multer from "multer"
import nodemailer from "nodemailer"
import emailTemplate from "../utils/createTemplate"
import {UploadApiResponse,v2 as cloudinary} from "cloudinary"
import File from "../models/File"
const router=express.Router()


const storage=multer.diskStorage({})
const uploads=multer({storage})
import https from "https"

router.post("/upload",uploads.single("myFile"),async(req,res)=>{
  try{
    if(!req.file)
      return res.status(400).json({message:"Sorry we need a document",status:false})
    console.log(req.file)
    let uploadedFile:UploadApiResponse
    try{
      uploadedFile=await cloudinary.uploader.upload(req.file.path,{
        folder:"shareMeSantra-Drive",
        resource_type:"auto"
      })
    }catch(error){
      console.log(error)
      return res.status(400).json({message:`cloudinary error ${error}`,status:false})
    }
    const {originalname}=req.file
    const {secure_url,bytes,format}=uploadedFile
    const _file=new File({
      filename:originalname,
      sizeInBytes:bytes,
      secure_url,
      format,

    })
    _file.save((err:any,file:any)=>{
      if(err) return res.status(401).json({message:`file not saved ${err}`,status:false})
      if(file) return res.status(201).json({
        id:file._id,
        downloadPageLink:`${process.env.API_BASE_ENDPOINT_CLIENT}download/${file._id}`
        ,status:true})

    })
  }catch(error){
    console.log(error)
    return res.status(500).json({message:`Server error ${error}`,status:false})

  }
})

router.get("/:id",async(req,res)=>{
  try{
    const id=req.params.id
    const file=await File.findById(id)
    if(!file)
      return res.status(401).json({message:'file does not exit',status:false})
    const {filename,format,sizeInBytes}=file
    return res.status(201).json({
      name:filename,
      sizeInBytes,
      format,
      id
    })
  }catch(error){
    return res.status(501).json({message:`server error ${error}`,status:false})
    console.log(error)
  }
})

router.get("/:id/download",async(req,res)=>{
  try{
    const id=req.params.id
    const file=await File.findById(id)
    if(!file)
      return res.status(401).json({message:'file does not exit',status:false})
    https.get(file.secure_url,(fileStream)=>fileStream.pipe(res))

  }catch(error){
    return res.status(501).json({message:`server error ${error}`,status:false})
    console.log(error)
  }
})

router.post("/email",async(req,res)=>{
  // validation
  const {emailFrom,emailTo,id}=req.body

  // check file exists or not
   const file=await File.findById(id)

  if(!file) return res.status(401).json({message:"file does not exists !!! ",status:true})

  //create transportar
  let transportar=nodemailer.createTransport({
    host:String("smtp.gmail.com"!),
    port:Number(process.env.SENDINBLUE_SMTP_PORT),
    secure:false,
    auth:{
      user:process.env.SMTP_USER,
      pass:process.env.SMTP_PASSWORD,
    },
    tls:{
      rejectUnauthorized:false
    }
  })

  // process the email data
  const {filename,sizeInBytes}=file
  const fileSize=`${(Number(sizeInBytes)/(1024*1024)).toFixed(2)} MB`
  const downloadPageLink=`${process.env.API_BASE_ENDPOINT_CLIENT}download/${file._id}`
  const mailMessage={
    from:emailFrom,
    to:emailTo,
    subject:`file send from ${emailTo}`,
    text:`file send from ${emailTo}`,
    html:emailTemplate(emailFrom,emailTo,downloadPageLink,filename,fileSize)
  }

  // send email through transportar
  transportar.sendMail(mailMessage,async(error,info)=>{
    if(error){
      console.log(error)
      return res.status(501).json({message:`server Error from mail ${error}`,status:false})
    }
    file.sender=emailFrom
    file.receiver=emailTo
    file.save((error,file)=>{
      if(error) return res.status(501).json({message:`server Error from database ${error}`,status:false})
      if(file) return res.status(201).json({message:"Email sent",status:true})
    })

  })



});




export default router
