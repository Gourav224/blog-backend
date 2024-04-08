import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

// cloudinary.config({ 
//     cloud_name: 'gourav224', 
//     api_key: '463935783975591', 
//     api_secret: '3iuPHMmpzGjIMaszmOMFQnL-0DA' 
//   });
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null;
        }
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(`${localFilePath}`,
            { resource_type: "auto" });

        fs.unlinkSync(localFilePath)//  remove the locally saved temporary file as the upload operation got failed
        // file has been uploaded successfull
        // console.log("file is uploaded on cloudinary", response.url);
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath)//  remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

const deleteformCloudinary = async (imageUrl) => {

    try {
        if (!imageUrl) {
            return null;
        }
        // Extract the public ID from the URL
        const publicId = imageUrl.split('/').pop().replace(/\.[^/.]+$/, '');
        // console.log(publicId);
        // Delete the image using the extracted public ID
        const response = await cloudinary.uploader.destroy(publicId);
        // console.log(response);
        return response;
    } catch (error) {
        return null;
    }
}


export { uploadOnCloudinary, deleteformCloudinary }