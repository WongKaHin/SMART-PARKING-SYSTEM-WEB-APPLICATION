var express = require('express');
var router = express.Router();
const { connectDB } = require('../db');
const { ObjectId } = require('mongodb');

/* GET home page. */
router.get('/', async(req, res, next) => {
  if(req.session.isLoggedIn){
    try{
      const db = await connectDB();
      let data = await db.collection('login').findOne({_id:new ObjectId(req.session._id)}); //user data
      let favorites = await db.collection('favorites').find({userId: req.session._id}).toArray(); //收藏停車場
      const isLoggedIn = req.session.isLoggedIn || false
      res.render('index', {data, favorites, isLoggedIn} );
    } catch(err) {
      console.error(err.name, err.message);
      res.status(500).send('Internal Server Error');
    }
  }else {
    res.render('index', {data:"", isLoggedIn:false, favorites:""})
  }
});

router.get('/detail/:id', async (req, res) => {
  if(req.session.isLoggedIn){
    carparkId = parseInt(req.params.id);
    try{
      const db = await connectDB();
      let carpark = await db.collection('carpark-info-KE').findOne({_id:carparkId});
      let data = await db.collection('login').findOne({_id:new ObjectId(req.session._id)});
      if(!carpark) {
        const err = new Error('Carpark not found');
        err.status = 404;
        const isLoggedIn = req.session.isLoggedIn || false
        return res.status(404).render('error', { error: err, data:"", isLoggedIn});
      }
      const isLoggedIn = req.session.isLoggedIn || false
      res.render('detail', {data, isLoggedIn, carpark});
    } catch(err) {
      console.error(err.name, err.message)
    }
  } else {
    res.redirect('/login');
  }
})



module.exports = router;
