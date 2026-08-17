import userModel from "../models/User.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config()

export async function register(req, res) {
    const { email, password, role, internCode } = req.body;

    const isUserExists = await userModel.findOne({
        $or:[
            {email},
            {internCode}
        ]
    });

    if(isUserExists){
        return res.status(409).json({
            message: "user already exists"
        })
    };

    const user = await userModel.create({
        email: email,
        password: password,
        role: role,
        internCode: internCode

    });

    const token = jwt.sign({
        id: user._id,
        email: email
    }, process.env.JWT_SECRET, {expiresIn: "7d"});

    res.cookie("token", token);

    res.status(200).json({
        message: "User registered successfully",
        user: {
            id: user._id,
            email: user.email
        }
    })

}

export async function login(req, res) {
    const { email, password, internCode } = req.body

    const user = await userModel.findOne({
        email: email,
        internCode: internCode
    })

    if (!user) {
        return res.status(400).json({
            message: "Invalid credentials",
        })
    }

    const isPasswordMatch = await user.comparePassword(password)

    if (!isPasswordMatch) {
        return res.status(400).json({
            message: "Invalid credentials",
        })
    }

    const token = jwt.sign({
        id: user._id,
        email: email
    }, process.env.JWT_SECRET, { expiresIn: "7d" })

    res.cookie("token", token)

    res.status(200).json({
        message: "user logged in successfully",

        user: {
            id: user._id,
            email: user.email,
        }
    })
}

export async function getMe(req,res){
    try{
        userId = req.user._id;

        const user = await userModel.findById(userId);

        if(!user){
            return res.status(404).json({
                message: "user not found"
            })
        }

        res.status(200).json({
            message: "user found",
            email: user.email,
            role: user.role
        })
    }catch(err){
        res.status(500).json({
            message: "internal server error"
        })
    }
}