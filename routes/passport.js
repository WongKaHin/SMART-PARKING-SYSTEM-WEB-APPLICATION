const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
const { connectDB } = require('../db'); // 數據庫邏輯
const JWT_SECRET = 'your-jwt-secret';
require('dotenv').config();

// 配置 Local Strategy
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const db = await connectDB();
    const user = await db.collection('login').findOne({ username });

    if (!user) {
      return done(null, false, { message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return done(null, false, { message: 'Incorrect password.' });
    }

    return done(null, user); // 驗證成功
  } catch (err) {
    return done(err);
  }
}));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/login/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const db = await connectDB();
      let user = await db.collection('login').findOne({ googleId: profile.id });

      if (!user) {
        // 如果用戶不存在，則創建新用戶
        user = await db.collection('login').insertOne({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          role: 'member', // 可以默認為普通用戶
          createdAt: new Date(),
          updatedAt: new Date()
        });
        user = await db.collection('login').findOne({ googleId: profile.id });
      }
      console.log("user: ", user);
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// 配置 JWT Strategy
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET,
};
passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
  try {
    const db = await connectDB();
    const user = await db.collection('login').findOne({ _id: jwt_payload.id });

    if (!user) {
      return done(null, false, { message: 'User not found.' });
    }

    return done(null, user); // 驗證成功
  } catch (err) {
    return done(err);
  }
}));

// 序列化與反序列化
passport.serializeUser((user, done) => {
    done(null, { id: user._id, role: user.role }); // 只保存簡化的信息
  });
  

passport.deserializeUser(async (id, done) => {
  try {
    const db = await connectDB();
    const user = await db.collection('login').findOne({ _id: id });
    done(null, user);
  } catch (err) {
    done(err);
  }
});


