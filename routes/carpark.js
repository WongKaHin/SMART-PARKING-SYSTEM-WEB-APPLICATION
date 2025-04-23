const express = require('express');
const router = express.Router();
const { connectDB } = require('../db');



router.get("/:type", async (req, res) => {
    const db = await connectDB();
    const type = req.params.type; // 接收車位類型參數
    try {
        const carparks = await db.collection("carpark-view").find({ [type]: { $exists: true } }).toArray();
        res.json(carparks); // 返回數據
    } catch (error) {
        console.error(error);
        res.status(500).send("伺服器錯誤");
    }
});

router.get('/:type/search', async (req, res) => {
    const searchValue = req.query.q || ''; // 獲取查詢的名稱
    const carparkType = req.params.type; // 獲取車位類型
    const regex = new RegExp(searchValue, 'i'); // 搜尋名稱忽略大小寫
    console.log('Search regex:', regex);
    console.log('Search type:', carparkType);

    try {
        const db = await connectDB();

        // 構建搜尋條件
        const query = searchValue ? {
            $and: [
                { name: regex }, // 匹配停車場名稱
                carparkType ? { [`${carparkType}`]: { $exists: true } } : {} // 是否存在特定車位類型
            ]
        } : carparkType ? { [`${carparkType}`]: { $exists: true } } : {};

        const results = await db.collection('carpark-view')
            .find(query)
            .toArray();

        res.json(results); // 返回搜尋結果作為 JSON
    } catch (err) {
        console.error('Error during search:', err);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;



