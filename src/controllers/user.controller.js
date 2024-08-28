import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefeshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating refresh and access token"
    );
  }
};

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
  // console.log(req.body);

  // console.log("email", email);

  //  if(fullName === "") {
  //    throw new ApiError(400, "fullName is required")
  //  }

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with Email or username already exists");
  }
  // console.log("files Data:", req.files);

  // console.log("files one data: ",req.files.avatar[0].path);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar File is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "avatar File not uploaded on server");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
    email,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registration the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req-body -> data
  // username or email
  // find user
  // password check
  // access and refresh token
  // send cookie

  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  // console.log(user);

  if (!user) {
    throw new ApiError(404, " user does not exist ");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, " invalid user password or credentials");
  }

  const { accessToken, refreshToken } = await generateAccessTokenAndRefeshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  console.log(req.user._id);
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  console.log("Logout is successfuly ");

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incommingRefreshToken) {
    throw new ApiError(401, "unAuthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "inValidRefresh Token");
    }

    if (incommingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used ");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessTokenAndRefeshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "access token refreshed "
        )
      );
  } catch (error) {
       throw new ApiError(401, error?.message || "invalid refresh Token")
  }

});

const changeCurrentPassword = asyncHandler( async (req, res) => {
      const {oldPassword, newPassword} = req.body
      const user = await User.findById(req.user._id)

      // if(!(newPassword === confirmPassword)){
      // }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect) {
         throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
      new ApiResponse(200, {}, "password changed successfully")
    )


})

const getCurrentUser = asyncHandler( async (req, res) => {
   return res
   .status(200)
   .json(
    200,
    req.user,
    "current user fetched successfuly"
   )
})

const updateAccountDetail = asyncHandler( async (req, res) => {
          const {fullName, email} = req.body

          if(!fullName || !email) {
             throw new ApiError(400, "All fields are required")
          }

         const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
              $set: {
                fullName: fullName,
                email: email,
              }
            },
            {new: true}
          ).select("-password")

          return res
                .status(200)
                .json( new ApiResponse(200, user, "Account detail updated successfuly"))
})

const updateUserAvatar = asyncHandler( async(req, res) => {
  const avatarlocalPath = req.file?.path

  if(!avatarlocalPath) {
      throw new ApiError(400, "Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarlocalPath)
    if(!avatar.url) {
          throw new ApiError(400, "Error while uploading avatar on Cloudinary")
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
         $set: { avatar: avatar.url}
      },
      {
        new: true
      }    
    ).select("-password")

    return res
    .status(200)
    .json(
      new ApiResponse(200, user , "Avatar Image updated successfully ")
    )
    
})


const updateUserCoverImage = asyncHandler( async(req, res) => {
  const coverImagelocalPath = req.file?.path

  if(!coverImagelocalPath) {
      throw new ApiError(400, "CoverImage Image file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImagelocalPath)
    if(!coverImage.url) {
          throw new ApiError(400, "Error while uploading coverImage on Cloudinary")
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
         $set: { coverImage: coverImage.url}
      },
      { new: true }    
    ).select("-password")

    return res
    .status(200)
    .json(
      new ApiResponse(200, user , "CoverImage updated successfully ")
    )

})

export { 
  registerUser, 
  loginUser, 
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetail,
  updateUserAvatar,
  updateUserCoverImage,
 };
