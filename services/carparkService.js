const schedule = require('node-schedule');
const axios = require("axios");
const { connectDB } = require('../db');


async function fetchCarparkData() {
    try {
        const db = await connectDB();
        const now = new Date(); // 當前時間，統一使用
      
        // 抓取 carpark-info-KE 資料
        const infoResponse = await axios.get("https://sps-opendata.pilotsmartke.gov.hk/rest/getCarparkInfos");
        const infoData = infoResponse.data["results"];
        console.log(`抓取 carpark-info-KE，共 ${infoData.length} 條數據`);
      
      
        // 將新數據插入臨時集合
        await db.collection('temp-carpark-info').deleteMany({}); // 清空臨時集合
        await db.collection('temp-carpark-info').insertMany(infoData);
        console.log("臨時 carpark-info 數據插入完成");
      
        // 合併數據到主集合
        await db.collection('carpark-info-KE').deleteMany({}); // 清空主集合
        await db.collection('carpark-info-KE').insertMany(infoData);
        console.log("carpark-info-KE 更新完成");
      
        // 抓取 carpark-vacancy 資料
        const vacancyResponse = await axios.get("https://sps-opendata.pilotsmartke.gov.hk/rest/getCarparkVacancies");
        const vacancyData = vacancyResponse.data["results"];
        console.log(`抓取 carpark-vacancy，共 ${vacancyData.length} 條數據`);
      
        // 將新數據插入臨時集合
        await db.collection('temp-carpark-vacancy').deleteMany({}); // 清空臨時集合
        await db.collection('temp-carpark-vacancy').insertMany(vacancyData);
        console.log("臨時 carpark-vacancy 數據插入完成");
      
        // 合併數據到主集合
        await db.collection('carpark-vacancy').deleteMany({}); // 清空主集合
        await db.collection('carpark-vacancy').insertMany(vacancyData);
        console.log("carpark-vacancy 更新完成");
      
        // 合併到 carpark-view
        console.log("準備執行 $merge 到 carpark-view...");
        const data = await db.collection("carpark-vacancy").aggregate([
          {
            $lookup: {
              from: "carpark-info-KE",
              localField: "_id",
              foreignField: "_id",
              as: "info"
            }
          },
          {
            $unwind: {
              path: "$info",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $project: {
              _id: 1,
              closed: 1,
              privateCar: 1,
              LGV: 1,
              HGV: 1,
              coach: 1,
              motorCycle: 1,
              lastUploadDate: 1,
              eob: 1,
              name: "$info.name"
            }
          },
          {
            $merge: {
              into: "carpark-view",
              whenMatched: "merge",
              whenNotMatched: "insert"
            }
          }
        ]).toArray();
        console.log("carpark-view 更新完成");
      } catch (error) {
        console.error("處理資料時出錯：", error);
      }           
}

schedule.scheduleJob('* * * * *', async () => {
    fetchCarparkData()// 手動觸發更新
});

module.exports = { fetchCarparkData };