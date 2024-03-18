import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";
          
// cloudinary.config({ 
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//     api_key: process.env.CLOUDINARY_API_KEY, 
//     api_secret: process.env.CLOUDINARY_API_SECRET 
//     // cloud_name: "binod123", 
//     // api_key: "892976618385919", 
//     // api_secret: "RF_G6FTuzb4br7XzeZ-hmSCh1HA" 
// });

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });

const uploadOnCloudinary = async (localFilePath) => {
    try {
        console.log('1')
        if (!localFilePath) return null;
        console.log('2', localFilePath)

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type : "auto"
        })
        console.log("file is uploaded on cloudinary ", response.url);

        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        console.log('3', error)

        fs.unlinkSync(localFilePath);
        return null;
    }
}

export { uploadOnCloudinary }