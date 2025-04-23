const express = require('express');
const router = express.Router();
const { connectDB } = require('../db');
const { ObjectId } = require('mongodb');
const Joi = require('joi');

router.get('/', async (req, res)=> {
        const db = await connectDB();
        let user = await db.collection('login').findOne({_id:new ObjectId(req.session._id)});
        const isLoggedIn = req.session.isLoggedIn || false
        res.render('reserve', {data:user, isLoggedIn});
});

router.post('/', async (req, res) => {
    try {
        const { startTime, vehicleType, parkingType } = req.body;

        // 比較是否早於現在時間
        const now = new Date();
        const start = new Date(startTime);

        // 驗證邏輯
        if (start < now) {
            return res.status(400).json({ success: false, message: "The start time cannot be earlier than now" });
        }

        const userId = req.session._id;
        const db = await connectDB();

        // 獲取用戶收藏的停車場
        const favorites = await fetchFavorites(userId, db);
        const carparkIds = favorites.map(item => item.carparkId);

        // 如果用戶沒有收藏停車場，返回錯誤信息
        if (carparkIds.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "You have no favorites so you can't book a car park。" 
            });
        }

        // 創建時間戳
        const createdAt = now.toISOString();
        const updatedAt = createdAt;

        await db.collection('reservation').insertOne({
            userId,
            carparkIds,
            startTime: start,
            vehicleType,
            parkingType,
            status: "pending",
            createdAt,
            updatedAt
        });
        


        res.status(200).json({ success: true, message: "Reservation has been submitted and is being processed..." });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: "Internal server error, please try again later。" });
    }
});


// 抽離獲取收藏車位的邏輯
async function fetchFavorites(userId, db) {
    return db.collection('favorites')
        .find({ userId })
        .project({ carparkId: 1, _id: 0 })
        .toArray();
}


module.exports = router;