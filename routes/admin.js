const express = require('express');
const router = express.Router();
const { connectDB } = require('../db');
const { ObjectId } = require('mongodb');

//顯示admin的頁面 (後台管理介面)
router.get('/', async (req, res) => {
    if(req.session.role === 'admin'){
        try {
            const db = await connectDB();
            let data = await db.collection('login').find().toArray();
            let user = await db.collection('login').findOne({_id:new ObjectId(req.session._id)});

            res.render('admin', { member: data , user: user});
        } catch (err) {
            console.error(err.name, err.message);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.redirect('/login');
    }
});

router.get('/member', async(req, res) => {
    try{
        const db = await connectDB();
        let data = await db.collection('login').find().toArray();
        res.json(data);
    } catch(err) {
        console.error(err.name, err.message);
        res.status(500).send('Internal Server Error');
    }
})

//搜尋功能
router.get('/member/search', async (req, res) => {
    const searchValue = req.query.q || ''; // 確保從查詢參數中獲取搜尋值
    if (!searchValue || typeof searchValue !== 'string') {
        return res.status(400).send("無效的搜尋條件");
      }
    const regex = new RegExp(searchValue, 'i'); // 使用忽略大小寫的正則表達式
    console.log('regex: ',regex);
    try {
        const db = await connectDB();
        const results = await db.collection('login').find(
            searchValue ? {
                $or: [
                    { name: regex },
                    { email: regex },
                    { role: regex },
                    { phone: regex },
                    { sex: regex },
                    { age: regex },
                ]
            } : {}
        ).toArray();
        console.log(results)
        res.json(results); // 返回搜尋結果作為 JSON
    } catch (err) {
        console.error(err.name, err.message);
        res.status(500).send('Internal Server Error');
    }
});



module.exports = router;