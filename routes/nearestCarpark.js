const express = require('express');
const router = express.Router();
const { connectDB } = require('../db');
const { ObjectId } = require('mongodb');

router.get('/', async(req, res) => {
    const db = await connectDB();
    let data = await db.collection('login').findOne({_id:new ObjectId(req.session._id)}); //user data
    const isLoggedIn = req.session.isLoggedIn || false
    res.render('nearestCarpark', {data, isLoggedIn})
})

router.get('/info', async(req, res, next) => {
    const db = await connectDB();
    let carpark = await db.collection('carpark-info-KE').find().toArray();
    let vacancy = await db.collection('carpark-vacancy').find().toArray();
    res.json({carpark, vacancy});
})

module.exports = router;
