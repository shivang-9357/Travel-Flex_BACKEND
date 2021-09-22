const fs = require("fs");
const HttpError = require("../models/http-error");
const uuid = require('uuid');
const { validationResult } = require("express-validator");
const getCoordsForAddress = require('../util/location');
const Place = require("../models/place");
const User = require("../models/users");
const mongoose = require('mongoose');

// let DUMMY_PLACES = [
//     {
//         id:"p1",
//         title: "Taj Mahal",
//         description: "Most Beautiful Wonder of The World !",
//         imageUrl: "https://i2.wp.com/www.smartertravel.com/wp-content/uploads/2019/07/taj-mahal.jpg?fit=1920%2C1080&ssl=1",
//         address : "Dharmapuri, Forest Colony, Tajganj, Agra, Uttar Pradesh 282001",
//         location:{
//             lat:27.173891,
//             lng:78.042068
//         },
//         creator: "u1"
//     }
// ];

const getPlaceById = async(req, res, next)=>{
    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById(placeId); 
    } catch (err) {
        const error = new HttpError("Something went wrong", 500);
        console.log(err);
        return next(error);
    }
    if (!place) {
        const error = (new HttpError("Could not find a place for the provided id.",404));
        return next(error);
    }
    res.json( {place: place.toObject({getters:true})});
}

const getPlacesByUserId =  async(req, res, next)=>{
    const userId = req.params.uid;

    let userWithPlaces;
    try {
        userWithPlaces = await User.findById(userId).populate('places'); 
    } catch (err) {
        const error = new HttpError("Something went wrong", 500);
        return next(error);
    }
    if (!userWithPlaces ) {
        const error = (new HttpError("Could not find a place for the provided id.",404));
        return next(error);
    }
    res.json( {places: userWithPlaces.places.map( p => p.toObject( {getters:true} ) )});
}

const createPlace = async(req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new HttpError("Invalid Data Entered! Please check your Input and try again.");
    }

    const {title, description, address} = req.body;

    let coordinates,location;
    try {
        coordinates = await getCoordsForAddress(address);
        location = {
            lat:coordinates[0],
            lng:coordinates[1]
        }
    } catch (error) {
        return next(error);
    }
    const createdPlace = new Place({
        title,
        description,
        address,
        location,
        image: req.file.path,
        creator: req.userData.userId
    });

    let user;
    try {
        user = await User.findById(req.userData.userId);
    } catch (error) {
        const err = new HttpError("Creating user failed.", 500);
        return next(err);
    }
    if (!user) {
        return next(new HttpError("Could not find user by given id.", 404));
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({session: sess});
        user.places.push(createdPlace);
        await user.save({session: sess});
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError("Failed to save place.", 500);
        return next(error);
    }

    

    res.status(201).json({place: createdPlace});
};

const updatePlace = async(req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new HttpError("Invalid Data Entered! Please check your Input and try again.");
    }
    const {title, description} = req.body;
    const placeId = req.params.pid;
    let place;
    try {
        place = await Place.findById(placeId);
    } catch (error) {
        const err = new HttpError("Something went wrong!", 500);
        return next(err);
    }

    if (place.creator.toString() !== req.userData.userId) {
        const err = new HttpError("You are not Authorized for this action!", 401);
        return next(err);
    }

    place.title = title;
    place.description = description;

    
    
    try {
        await place.save();
    } catch (error) {
        const err = new HttpError("Something went wrong!", 500);
        return next(err);
    }

    res.status(200).json({place:place.toObject( {getters: true} )});
}

const deletePlace = async(req, res, next) => {
    const placeId = req.params.pid;
    
    let place;
    try {
        place = await Place.findById(placeId).populate('creator');
    } catch (error) {
        const err = new HttpError("Something went wrong", 500);
        return next(err);
    }

    if (!place) {
        return next(new HttpError("Could not delete place", 500));
    }


    if (place.creator.id !== req.userData.userId) {
        const err = new HttpError("You are not Authorized for this action!", 401);
        return next(err);
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.remove({session:sess});
        place.creator.places.pull(place);
        await place.creator.save({session: sess});
        await sess.commitTransaction();
        
    } catch (error) {
        const err = new HttpError("Something went wrong.", 500);
        return next(err);
    }
    fs.unlink(place.image, err => {} );
    res.status(202).json({place:"The place has been successfully deleted."});

}

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;