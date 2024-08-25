import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";



const registerUser = asyncHandler(async (req, res) => {

  // res.status(500).json({
  //   message: "mukesh utmani"
  // })
   
  // get user detail from front-end
  // validation - not empty
  // check if user  already registered/exit , username , email
  // check for images and avatar
  // upload them to cloudinary, avtar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response

  const { fullName, email, username, password } = req.body;
  // console.log("email", email);

  //  if(fullName === "") {
  //    throw new ApiError(400, "fullName is required")
  //  }

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  
 const existedUser = User.findOne({
    $or: [{username} , {email}]
  })
  if(existedUser){
    throw new ApiError(409, "User with Email or username already exists")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path

  if(!avatarLocalPath) {
    throw new ApiError(400, "avatar File is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
   
  if(!avatar) {
    throw new ApiError(400, "avatar File not uploaded on server")
  }
  
  const user = await  User.create({
     fullName,
     avatar: avatar.url,
     coverImage: coverImage?.url || "",
     password,
     email,
     username: username.toLowerCase()

  })

   const createdUser = await User.findById(user._id).select(
     "-password -refreshToken"
   )

   if(!createdUser) {
            throw new ApiError(500, "something went wrong while registration the user")
   }


    return res.Status(201).json(
       new ApiResponse(200, createdUser, "user registered successfully")
    )

});

export { registerUser };
