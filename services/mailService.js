const nodemailer = require('nodemailer');
require('dotenv').config();


// 創建郵件傳輸器
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // SMTP 伺服器地址
  port: 587,             // 使用的端口（587 為 TLS，465 為 SSL）
  secure: false,         // 使用 TLS 設置為 false，使用 SSL 設置為 true
  auth: {
    user: process.env.email, // 您的郵箱
    pass: process.env.pass, // 郵箱密碼或應用專用密碼
  },
  tls: {
    rejectUnauthorized: false, // 忽略未驗證的證書
  },
});


// 發送郵件函數
const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.email,
        to,
        subject,
        text
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('郵件發送成功');
    } catch (error) {
        console.error('郵件發送失敗:', error);
        throw error;
    }
};

module.exports = {sendEmail};
