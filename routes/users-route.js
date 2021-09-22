const express = require('express');
const { check } = require("express-validator");

const router = express.Router();

const userControllers = require("../controllers/users-controllers");
const fileUpload = require("../middleware/file-upload");

router.get("/",userControllers.getAllUsers);

router.post("/signup",
    fileUpload.single("image"),
    [
    check("name").not().isEmpty(),
    check("email").isEmail(),
    check("password").isLength({min: 8})
],userControllers.signupUser);

router.post("/login",[
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({min: 8})
],userControllers.loginUser);

module.exports = router;