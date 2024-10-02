const userModel = require("../Model/model")
const { User_service } = require("../Service")
const bcrypt = require("bcrypt")
const saltRounds = 10
const salt = "$2b$10$t7oxiwchWGHa/B9w0AzrYO"
const jwt = require('jsonwebtoken')


const create_register_controller = async(req,res) =>{
    try {
        const Password = await bcrypt.hash(req.body.Password, salt)
        
        const data = {...req.body,Password}
     
        const new_password = await bcrypt.hash(Password,10)
        if(!new_password){
            throw new Error("password not match")
        }
        const searched_result = await User_service.findByEmail(data.Email,Password)
        // console.log("======>>>>" , searched_result)

        if(searched_result){
            throw new Error(`Email by this name ${data.Email} already exist`)
        }
       
          // service
        const new_series = await User_service.create_register_S(data)
           // success response
        res.status(200).json({
            success: true,
            message: "Email created successfully",
            data: new_series
        })
    } catch (error) {
       
        res.status(400).json({
            success:"false",
            message:error.message
        })
    }
}
//get all register account list
const get_register_controller = async(req,res) =>{
  
    try {
        const get_register = await User_service.get_all_register_S()

        if(!get_register){
            throw new Error("register account data not found");  
        }
        res.status(200).json({
            success:true,
            message:"Register_Account retrieved successfully",
            data:get_register
        })
    } catch (error) {
        res.status(400).json({
            success:"false",
            message:"Error retrieving Register_Account"
        })
    }
}

//update register account
const update_register_C = async(req,res) =>{
    try {
          
        const id = req.params.id
        const data = req.body

        const updateData = await User_service.update_register_S(id,data)
        // console.log(updateData);
        
        if(!updateData){
            throw new Error("update register account data not found");
            }
            
        res.status(200).json({
            message:"update account successfully",
            success:true,
            data:updateData
        })
    } catch (error) {
        res.status(400).json({
            message:message.error,
            success:false
        })
    }
}

//delete register account
const delete_register_c = async(req,res) =>{
    try {
        const id = req.params.id
        const data_delete = await User_service.delete_register_S(id)
        if(!data_delete){
            throw new Error("delete register account data not found");
        }
        res.status(200).json({
            message:"delete account successfully",
            success:true,
            data:data_delete
        })
    } catch (error) {
        res.status(400).json({
            message:message.error,
            success:false
        })
    }
}


const create_login_C = async (req, res) => {
    try {
        const { Email, Password } = req.body;

        // Step 1: Check if the email exists
        const login_user = await userModel.findOne({ Email });

        if (!login_user) {
            return res.status(422).json({
                message: "User not found",
                success: false
            });
        }

        // Step 2: Check if the account is blocked
        if (login_user.isBlocked) {
            return res.status(403).json({
                message: "Your account is blocked",
                success: false
            });
        }

        // Step 3: Validate the password
        const isPasswordValid = await bcrypt.compare(Password, login_user.Password);
        if (!isPasswordValid) {
            return res.status(422).json({
                message: "Incorrect password",
                success: false
            });
        }
       
        const jwtToken = jwt.sign(
            { Email: login_user.Email },
            "secreat123",
            { expiresIn : '24h'}

        )
        // Step 4: Successful login
        return res.status(200).json({
            message: "Login successful",
            success: true,
            jwtToken,Email,
            data: login_user
        });

    } catch (error) {
        return res.status(500).json({
            message: "An error occurred",
            error: error.message
        });
    }
};
// //decode jwt token
// const decodeToken = async (req, res, next) => {
//     try {
//         const jwtToken = req.header('Authorization');

//         if (!jwtToken) {
//             return res.status(401).json({
//                 success: false,
//                 message: "No token provided"
//             });
//         }

//         // Verify if the token starts with 'Bearer '
//         const token = jwtToken.split(' ')[1];
//         if (!token) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Malformed token"
//             });
//         }

//         const decode = await jwt.verify(token, 'secreat123');

//         if (!decode) {
//             throw new Error("Token could not be decoded");
//         }

//         req.user = decode;
//         next();
//     } catch (error) {
//         return res.status(401).json({
//             success: false,
//             message: "Invalid token: " + error.message
//         });
//     }
// };
const decodeToken = (req, res, next) => {
    try {
        const jwtToken = req.header('Authorization');

        if (!jwtToken) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }

        // Extract Bearer token
        const token = jwtToken.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Malformed token"
            });
        }

        // Verify the token
        const decode = jwt.verify(token, 'secreat123');

        // Attach decoded user information to request object
        req.user = decode;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid token: " + error.message
        });
    }
};


//block user
const block_user_c = async (req, res) => {
    try {
        const { Email} = req.body;
       
        // Find the user by email and update the isBlocked field to true
        const blockedUser = await userModel.findOneAndUpdate(
            { Email: Email },
            {isBlocked: true } 
        );
        // console.log(blockedUser);
        
        if (!blockedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "User account has been blocked",
            data: blockedUser
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to block user",
            error: error.message
        });
    }
}

//get all block user list
const get_blocked_user_list = async (req, res) => {
    try {
        const get_blockUsers = await User_service.get_blocked_user_list_S()

     return res.status(200).json({
            message:"All Block user list retrived successfully",
            success:true,
            data: get_blockUsers
        })
    } catch (error) {
        res.status(400).json({
            message: "Failed to get blocked user list",
            success: false,
        })
    }
}

//unblock user 
const unblock_user_c = async (req, res) => {
    try {
        const { Email } = req.body;

        // Find the user by email and update the isBlocked field to false
        const unblockedUser = await userModel.findOneAndUpdate(
            { Email: Email },
            { $set: { isBlocked: false } },
            { new: true }
        );

        if (!unblockedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User account has been unblocked",
            data: unblockedUser
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to unblock user",
            error: error.message
        });
    }
}

//get All UnBlock Usser
const unblock_user_list_c = async(req,res)=>{
    try {
        const unblock_list = await User_service.get_unblock_user_list_S()

        if(!unblock_list){
            throw new Error("unblock list not found")
        }
          console.log(unblock_list);
           
      res.status(200).json({
         message: "All unblock user list get successfully",
            success: true,
            data:unblock_list
        })
    } catch (error) {
        res.status(400).json({
            message:error.message,
            success:false
        })
    }
}
//get login user list
const get_login_controller = async(req,res) =>{
  
    try {
        const get_login = await User_service.get_all_login_S()

        if(!get_login){
            throw new Error("register account data not found");  
        }
        res.status(200).json({
            success:"true",
            message:"LOgin data retrieved successfully",
            data:get_login
        })
    } catch (error) {
        res.status(400).json({
            success:"false",
            message:"Error retrieving Register_Account"
        })
    }
}

// get details of a single user by email
const single_login_user = async (req,res) => {
   try {
   
        const user = await userModel.findOne({Email:req.params.Email})
        
        if(!user){
            throw new Error ('user not found')
        }     
        return  res.status(200).json({
                    message: "User found",
                    success:true,
                    data:user
                })
   } catch (error) {
    res.status(400).json({
        success:"false",
        message:"Error retrieving login Account"
    })
   }
}

//file upload with multer
const upload_file = (req, res)=>{
    try {
       return res.status(200).json({
            success:"true",
            message:"File uploaded successfully",
        })
    } catch (error) {
        res.status(400).json({
            success:"false",
            message:error.message
        })
    }
}










module.exports = {
    create_register_controller,
    get_register_controller,
    create_login_C,
    get_login_controller,
    single_login_user,
    update_register_C,
    delete_register_c,
    block_user_c,
    get_blocked_user_list,
    unblock_user_c,
    unblock_user_list_c,
    decodeToken,
    upload_file
    
}



