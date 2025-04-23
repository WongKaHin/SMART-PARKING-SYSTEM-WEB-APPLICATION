const schedule = require('node-schedule');
const { ObjectId } = require('mongodb');
const { sendEmail } = require('../services/mailService')
const {connectDB} = require('../db'); // 資料庫連接方法

schedule.scheduleJob('* * * * *', async () => { //每一min scan
    console.log("開始掃描 reservation..."); 
        try {
            const db = await connectDB();
            const now = new Date();
            const localNow = new Date(now.getTime());
            localNow.setSeconds(0, 0); 
            console.log('now: ',localNow);
    
            
            const reservations = await db.collection('reservation').find({
                startTime: { $eq: localNow },
                status: "pending"
            }).toArray();
            console.log('reservations: ',reservations)
    
            for (const reservation of reservations) {
                const { userId, carparkIds, vehicleType, parkingType } = reservation;
    
                const user = await db.collection('login').findOne({ _id: new ObjectId(userId) });
                console.log(user)
                if (!user || !user.email) {
                    console.error(`用戶 ${userId} 缺少有效的 email`);
                    continue;
                }
    
                const userEmail = user.email;
                const carparkData = await db.collection('carpark-view').find({
                    _id: { $in: carparkIds.map(id => parseInt(id, 10)) }
                }).toArray();
    
                let emailContent = `Dear user, your reservation time is due. The following is the parking space situation:\n\n`;
                let hasVacancy = false;
    
                carparkData.forEach(carpark => {
                    const carparkName = carpark.name;
                    const vehicleData = carpark[vehicleType];
    
                    if (vehicleData && vehicleData[parkingType] !== undefined) {
                        const vacancy = vehicleData[parkingType];
                        if (vacancy > 0) hasVacancy = true;
                        emailContent += `${carparkName}: ${vacancy} ${parkingType} \n`;
                    } else {
                        emailContent += `${carparkName}: None available ${parkingType} \n`;
                    }
                });
    
                if (!hasVacancy) {
                    emailContent += `\nSorry, there are currently no parking spaces available.\n`;
                }
    
                try {
                    console.log('emailContent: ',emailContent);
                    console.log('userEmail',userEmail);
                    await sendEmail(userEmail, 'Carpark reservation reminder', emailContent);
                    console.log(`郵件已成功發送給 ${userEmail}`);
    
                    await db.collection('reservation').updateOne(
                        { _id: reservation._id },
                        { $set: { status: "notified", updatedAt: now } }
                    );
                } catch (error) {
                    console.error(`郵件發送失敗給 ${userEmail}:`, error);
    
                    await db.collection('reservation').updateOne(
                        { _id: reservation._id },
                        { $set: { status: "failed", error: error.message, updatedAt: now } }
                    );
                }
            }
        } catch (error) {
            console.error("掃描預約時發生錯誤：", error);
        }
});
