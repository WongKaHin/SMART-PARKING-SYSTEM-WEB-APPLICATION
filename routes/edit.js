const express = require('express');
const router = express.Router();
const { connectDB } = require('../db');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

router.get('/', async (req, res, next) => { //回傳member的_id
    try {
      const db = await connectDB();
      const memberId = req.session._id;
      const isLoggedIn = req.session.isLoggedIn || false
      let member = await db.collection('login').findOne({ _id: new ObjectId(memberId) });
      if(!member) {
        const err = new Error('member not found');
        err.status = 404;
        const isLoggedIn = req.session.isLoggedIn || false
        return res.status(404).render('error', { error: err, data:"", isLoggedIn});
      }
      console.log(member.name);
      res.render('edit', {data: member, isLoggedIn});
    } catch (err) {
        console.error(err.name, err.message);
    }
  });

  router.post('/', async (req, res) => {
    try {
        const { name, email, oldPassword, newPassword, age, sex, phone } = req.body;
        const memberId = req.session._id;
        const updatedAt = new Date();


        // 準備要更新的字段，去除空值
        const newMember = { name, email, age, sex, phone, updatedAt };
        Object.keys(newMember).forEach(key => {
            if (!newMember[key]) delete newMember[key];
        });

        const db = await connectDB();

        if (oldPassword && newPassword) {
            // 如果需要更新密碼
            bcrypt.genSalt(10, (err, salt) => {
                if (err) throw err;
                bcrypt.hash(newPassword, salt, async (err, hash) => {
                    if (err) throw err;
                    newMember.password = hash;
                    await db.collection('login').updateOne(
                        { _id: new ObjectId(memberId) },
                        { $set: newMember }
                    );
                    res.status(200).json({ message: 'Update successful!', redirect: '/' });
                });
            });
        } else {
            // 如果不需要更新密碼
            await db.collection('login').updateOne(
                { _id: new ObjectId(memberId) },
                { $set: newMember }
            );
            res.status(200).json({ message: 'Update successful!', redirect: '/' });
        }
    } catch (err) {
        console.error(err.name, err.message);
        res.status(500).json({ message: 'An error occurred while updating. Please try again later.' });
    }
});



router.get('/delete/:id', async (req, res) => {
  const memberId = req.params.id;
  try{
    console.log(memberId)
    const db = await connectDB();
    const result = await db.collection('login').deleteOne({ _id: new ObjectId(memberId)});
    if (result.deletedCount === 1) {
      console.log(`Delete成功`);
  } else {
    console.log(`Delete不成功`);
  }
  res.redirect('/admin');
  } catch (err) {
    console.error(err.name, err.message);
  }
})

module.exports = router;
