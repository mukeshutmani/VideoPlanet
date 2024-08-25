import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'   // file system

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET

});

const uploadOnCloudinary = async (localFilePath) => {
   try {
    if(!localFilePath) return null;
    // upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
        resource_type: 'auto'
    })
    // console.log(response);
    
    // console.log("File is uploaded successfully on Cloudinary : ", response.url);
    fs.unlinkSync(localFilePath)
    return response;
   } catch (error) {
     fs.unlinkSync(localFilePath)  // removed the locally saved temp file as the upload opertaion got failed
     return null
   }
}

export {uploadOnCloudinary}