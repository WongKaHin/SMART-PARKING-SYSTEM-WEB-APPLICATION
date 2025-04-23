const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { connectDB } = require('../db');

//顯示註冊頁面
router.get('/', (req, res) => {
  res.render('register');
});

//註冊功能
router.post('/', async (req, res, next) => {
  try {
    const { username, name, email, password, sex, age, phone } = req.body; // 抓form中資料

    const createdAt = new Date();
    const updatedAt = new Date();

    const newMember = {
      username,
      name,
      email,
      sex,
      age,
      phone,
      role: 'member',
      createdAt,
      updatedAt
    };

    const db = await connectDB();

    // 檢查用戶名是否已存在
    let existingUser = await db.collection("login").findOne({ username: username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists. Please choose another one.' }); // 返回409錯誤碼
    }

    // 密碼加密
    bcrypt.genSalt(10, (err, salt) => {
      if (err) throw err;
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) throw err;
        newMember.password = hash;
        await db.collection("login").insertOne(newMember);
        return res.status(201).json({ message: 'Registration successful!' }); // 返回成功的狀態
      });
    });
  } catch (err) {
    console.error(err.name, err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


module.exports = router;
