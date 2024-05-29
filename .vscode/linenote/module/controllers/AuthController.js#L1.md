const httpStatus = require("http-status");
const jwt = require("jsonwebtoken");
const Response = require("../model/Response");
const User = require("../model/user");
const userValidator = require("../utils/UserValidator");
const logInValidator = require("../utils/LoginValidator");
const bcrypt = require("../utils/bcrypt");
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3')

const s3Client = new S3Client({
  credentials: {
    accessKeyId: 'AKIA2UC3FURGLRPFIXW6',
    secretAccessKey: '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'
  },
  region: 'ap-southeast-1'
})

const signUp = async (req, res) => {
  let response = null;
try {
    const { name, username, email, password } = await userValidator.validateAsync(req.body);

    const hashedPassword = await bcrypt.hash(password);
    const user = new User({ name, username, email, password: hashedPassword });

    const result = await user.save();
    response = new Response.Success(false, "Signup Success", result);
    res.status(httpStatus.OK).json(response);
} catch (error) {
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
};

//const showAllUsers = async (req, res) => {
//   let response = null;
//   try {
//     const users = await User.find().populate("activities");
//     for (const user of users) {
//       for (const activity of user.activities) {
//         const getObjectParams = {
//           Bucket: 'image-storage-diskominfo',
//           Key: activity.imgUrl
//         }
//         const command = new GetObjectCommand(getObjectParams)
//         const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
//         activity.imgUrl = url
//       }
//     }
//     response = new Response.Success(false, "Users retrieved successfully", users);
//     res.status(httpStatus.OK).json(response);
//   } catch (error) {
//     response = new Response.Error(true, error.message);
//     res.status(httpStatus.BAD_REQUEST).json(response);
//   }
// };

// const getUserActivities = async (req, res) => {
//   let response = null;
//   try {
//     const { userId } = req.params;
//     const user = await User.findById(userId).populate("activities");
//     if (!user) {
//       response = new Response.Error(true, "User not found");
//       res.status(httpStatus.NOT_FOUND).json(response);
//       return;
//     }
//     for (const activity of user.activities) {
//       const getObjectParams = {
//         Bucket: 'image-storage-diskominfo',
//         Key: activity.imgUrl
//       }
//       const command = new GetObjectCommand(getObjectParams)
//       const url = await getSignedUrl(s3Client, command, { expiresIn: 7600 })
//       activity.imgUrl = url
//     }
//     res.status(httpStatus.OK).json(user.activities);
//   } catch (error) {
//     response = new Response.Error(true, error.message);
//     res.status(httpStatus.BAD_REQUEST).json(response);
//   }
// };


const logIn = async (req, res) => {
    let response = null;
    const signInErrorMessage = "Invalid username or password";
    try {
      const request = await logInValidator.validateAsync(req.body);
  
      const user = await User.findOne({ username: request.username });
      if (!user) {
        response = new Response.Error(true, signInErrorMessage);
        res.status(httpStatus.BAD_REQUEST).json(response);
        return;
      }
  
      const isValidPassword = await bcrypt.compare(
        request.password,
        user.password
      );
      if (!isValidPassword) {
        response = new Response.Error(true, signInErrorMessage);
        res.status(httpStatus.BAD_REQUEST).json(response);
        return;
      }
  
      const createJwtToken = jwt.sign({ id: user._id }, process.env.KEY);
      const data = { token: createJwtToken, user };
      response = new Response.Success(false, "Login Success", data);
      res.status(httpStatus.OK).json(response);
    } catch (error) {
      response = new Response.Error(true, error.message);
      res.status(httpStatus.BAD_REQUEST).json(response);
    }
  };

const  getUserById = async (req, res) => {
  let response = null;
  try{
    const { userId } = req.params;
    const user = await User.findById(userId);
    if(!user){
      response = new Response.Error(true, "User not found");
      res.status(httpStatus.NOT_FOUND).json(response);
      return;
    }
    response = new Response.Success(false, "User retrieved successfully", user);
    res.status(httpStatus.OK).json(response);
  }catch(error){
    response = new Response.Error(true, error.message);
    res.status(httpStatus.BAD_REQUEST).json(response);
  }
}

// module.exports = { signUp, showAllUsers, logIn, getUserActivities, getUserById };
module.exports = { signUp, logIn, getUserById };

