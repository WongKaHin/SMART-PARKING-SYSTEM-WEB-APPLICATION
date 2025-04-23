var express = require('express');
var router = express.Router();
const { connectDB } = require('../db');
const { ObjectId } = require('mongodb');

router.get("/", async (req, res) => {
    try {
        const db = await connectDB();
        let data = await db.collection('login').findOne({_id:new ObjectId(req.session._id)}); //user data
        const carpark = await db.collection("carpark-view").find().toArray();
        const isLoggedIn = req.session.isLoggedIn || false
        res.render("favorites", { carpark, data, isLoggedIn }); // 將資料傳遞到 EJS 模板
    } catch (error) {
        console.error(error);
        res.status(500).send("伺服器錯誤");
    }
});

router.get('/:type', async (req, res, next) => {
  if (req.session.isLoggedIn) {
      try {
          const db = await connectDB();
          const userId = req.session._id; // 獲取用戶 ID
          const isLoggedIn = req.session.isLoggedIn || false
          const type = req.params.type;

          // 第一步：從 login 集合中查詢用戶名
          const user = await db.collection('login').findOne({ _id: new ObjectId(userId) });
          if (!user || !user.username) {
              return res.render('favorites', {
                  isLoggedIn,
                  success: false,
                  message: "無法找到用戶名，請稍後再試。",
                  username: "",
                  data: []
              });
          }
          const username = user.username;

          // 第二步：從 favorites 集合中查詢收藏的 carparkId
          const favorites = await db.collection('favorites').find({ userId: userId }).toArray();
          if (!favorites || favorites.length === 0) {
              return res.render('favorites', {
                isLoggedIn,
                success: false,
                message: "您尚未收藏任何停車場。",
                username: username,
                data: []
              });
          }

          // 提取收藏的 carparkId 列表
          const carparkIds = favorites.map(favorite => parseInt(favorite.carparkId, 10)); // 將 carparkId 轉換為整數
          
          // 第三步：從 carpark-view 集合中查詢詳細車位信息
          const carparks = await db.collection('carpark-view').find({
              _id: { $in: carparkIds }, // 確保類型一致，使用 Int32 查詢
              [type]: { $exists: true } 
          }).toArray();
          res.json(carparks)   
      } catch (err) {
          console.error("數據庫查詢失敗:", err.message);
          return res.status(500).render('favorites', {
              success: false,
              message: "內部服務器錯誤，請稍後再試。",
              username: "",
              data: []
          });
      }
  } else {
      // 未登錄，重定向到登錄頁面
      res.redirect('/login');
  }
});


router.post('/:id', async(req, res) => {
  const { userId, carparkId } = req.body;
  const db = await connectDB();
  const collection = db.collection('favorites');
  try{
    const existingFavorite = await db.collection('favorites').findOne({ userId, carparkId });
    if (existingFavorite) {
        return res.status(400).send({ message: '已收藏此停車場' });
    }
    const result = await collection.insertOne({
      userId,
      carparkId,
    });
    res.status(201).send({ id: result.insertedId });
  }catch(err){
    console.error(err.name, err.message)
  }
});

router.delete('/:id', async(req, res) => {
  const { userId, carparkId } = req.body;
  const db = await connectDB();
  const collection = db.collection('favorites');

  try {
      const data = await collection.deleteOne({ userId, carparkId });
      res.status(204).send(); // No Content
  } catch (err) {
      console.error('刪除收藏失敗:', err);
      res.status(500).send({ message: '刪除收藏失敗', error: err });
  }
})

module.exports = router;