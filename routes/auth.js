const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const JWT_SECRET = 'your-jwt-secret';

router.get('/', (req, res, next) => {
    res.render('login')
})

router.post('/', (req, res, next) => {
    passport.authenticate('local', async (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message });
  
      // 簽發 JWT
      const token = jwt.sign(
        { id: user._id, role: user.role, isLoggedIn: true },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.session._id = user._id;
      req.session.isLoggedIn = true;
      req.session.role = user.role;
      req.session.token = token;

      console.log(token)
  
      // 根據角色決定跳轉路徑
      let redirectPath;
      if (user.role === 'member') {
        redirectPath = '/';
      } else if (user.role === 'admin') {
        redirectPath = '/admin';
      } else {
        return res.status(400).json({ message: 'Invalid role.' });
      }
  
      // 返回數據給客戶端
      return res.status(200).json({
        message: 'Login successful!',
        id: user._id,
        role: user.role,
        isLoggedIn: true,
        token,
        redirect: redirectPath // 增加 redirect 路徑
      });
    })(req, res, next);
  });

  router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );
  
  router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {

      if (!req.user) {
        return res.status(401).json({ message: 'Google login failed.' }); // 返回錯誤信息
      }

        const token = jwt.sign(
            {
              id: req.user.googleId || req.user._id, // 儲存 Google ID 或資料庫的用戶 ID
              role: req.user.role, // 儲存角色
            },
            JWT_SECRET,
            { expiresIn: '1h' } // JWT 過期時間
          );

        req.session._id = req.user._id; // 或 req.user.googleId
        req.session.isLoggedIn = true;
        req.session.role = req.user.role;
        req.session.token = token;

        console.log("req.user.role : ", req.user.role );

        let redirectPath;
        if (req.user.role === 'member') {
          redirectPath = '/';
        } else if (req.user.role === 'admin') {
          redirectPath = '/admin';
        } else {
          return res.status(400).json({ message: 'Invalid role.' });
        }

      // 登入成功後跳轉
      if (req.user.role === 'admin') {
        res.redirect('/admin');
      } else {
        res.redirect('/');
      }
    }
  );
  
  router.get('/logout', (req, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });

router.get('/protected', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.status(200).json({
      message: 'Access granted!',
      user: req.user // 這裡包含 JWT 的 payload 信息
    });
  });
  

module.exports = router;