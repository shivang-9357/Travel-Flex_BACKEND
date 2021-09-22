const HttpError = require("../models/http-error.js");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/users");

const getAllUsers = async(req, res, next) => {
    let allUsers;
    try {
        allUsers = await User.find({}, '-password');
    } catch (error) {
        return next(new HttpError("Something went wrong!", 500));
    }
    res.status(200).json({users:allUsers.map( u=>u.toObject( {getters: true} )) });
};

const loginUser = async(req,res,next) => {
    const errors = validationResult(req);
    const {email, password} = req.body;
    let existingUser;
    try {
        existingUser = await User.findOne({email: email});
    } catch (error) {
        const err = new HttpError("Signup failed", 500);
        console.log(error);
        return next(err);
    }

    if (!existingUser) {
       return next(new HttpError("Invalid credential!", 403));
    }

    let isValidPassword = false;

    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (error) {
        return next(new HttpError("Could not log you in, please try again.", 500));
    }
    
    if (!isValidPassword) {
        return next(new HttpError("Invalid credential!", 403));
    }

    let token;
    try {
        token = jwt.sign(
            {userId: existingUser.id, email: existingUser.email},
            process.env.JWT_KEY,
            {expiresIn: '1h'}
        );
    } catch (error) {
        return next(new HttpError("Could not log you in, please try again.", 500));
    }
    res.status(201).json({userId: existingUser.id, email: existingUser.email, token:token});
};

const signupUser = async(req,res,next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next (new HttpError("Invalid Data Entered! Please check your Input and try again.", 422));
    }

    const {name, email, password} = req.body;
    
    let existingUser;
    try {
        existingUser = await User.findOne({email: email});
    } catch (error) {
        const err = new HttpError("Signup failed", 500);
        return next(err);
    }

    if (existingUser) {
        const err = new HttpError("Email already exists.", 500);
        return next(err);
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (error) {
        return next(new HttpError("Could not create user, please try again", 500));
    }
    
    const createdUser = new User({
        name,
        email,
        image: req.file.path ,
        password:hashedPassword,
        places: []

    });
    
    try {
        await createdUser.save()
    } catch (error) {
        const err = HttpError("Signup Failed", 500);
        return next(err);
    }
    
    let token;
    try {
        token = jwt.sign(
            {userId: createdUser.id, email: createdUser.email},
            process.env.JWT_KEY,
            {expiresIn: '1h'}
        );
    } catch (error) {
        return next(new HttpError("Could create the user, please try again.", 500));
    }
    console.log(token);
    res.status(201).json({userId: createdUser.id, email: createdUser.email, token:token});
};

exports.getAllUsers = getAllUsers;
exports.loginUser = loginUser;
exports.signupUser = signupUser;



