const express = require("express");

const path = require("path");

const bodyParser = require("body-parser");
const placeRoutes = require("./routes/places-route")
const userRoutes = require("./routes/users-route");
const fs = require("fs");

const HttpError = require("./models/http-error");

const mongoose = require("mongoose");

const app = express();

app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")))

app.use((req,res,next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

    next();
});

app.use("/api/places",placeRoutes);
app.use("/api/users",userRoutes);

app.use((req, res, next)=>{
    const error = new HttpError("Coud not find this route.", 404);
    throw error;
});

app.use((error, req, res, next)=>{
    if (req.file) {
        fs.unlink(req.file.path, err => {} );
    }
    if (res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({message: error.message || "Something went wrong!"});
});


mongoose
.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.uowvb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    app.listen(process.env.PORT || 5000);
})
.catch(err => {
    console.log(err);
});