const urlModel = require("../Models/urlModel");
const shortId=require("shortid")
const validUrl=require("valid-url");
const redis = require("redis");
const { promisify } = require("util");
const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
  };

  
  //Connect to redis
  const redisClient = redis.createClient(
    16772,
    "redis-16772.c264.ap-south-1-1.ec2.cloud.redislabs.com", 
    { no_ready_check: true }
  );
  redisClient.auth("GFWahgVJ6WdpO19O8aWa17EQ0pCpoTCj",  function (err) {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });
  
  
  
  //1. connect to the server
  //2. use the commands :
  
  //Connection setup for redis
  
  const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
  const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const shortenUrl=async function (req,res) {
    try {
        const data=req.body
        const {longUrl}=data
        if (Object.keys(data).length===0) {
            return res.status(400).send({status:false,message:'no data provided'})
        }
        if (!isValid(longUrl)) {
            return res.status(400).send({status:false,message:'longurl is required'})
        }

        if (!validUrl.isWebUri(longUrl)) {
            return res.status(400).send({status:false,message:'please provide a valid url'})
        }
        let cahcedProfileData = await GET_ASYNC(`${longUrl}`)
        if(cahcedProfileData) {
            console.log('cache data')
            console.log('==========')
            return res.status(200).send(JSON.parse(cahcedProfileData),"EX",10)
        }
        const checkUrl=await urlModel.findOne({longUrl:longUrl})
        if(checkUrl){
            return res.status(400).send({status:false, message:'this url already exist'})
        }    
        
        const urlCode=shortId.generate()
        const shortUrl="http://localhost:3000/" + urlCode
        data['shortUrl']=shortUrl
        data['urlCode']=urlCode

        // redisClient.set(`${longUrl}`, JSON.stringify(data),function (err,reply) {
        //     if(err) throw err;
        //     redisClient.expire(`${data}`, 10, function (err, reply) {
        //       if(err) throw err;
        //       console.log(reply);
        //     });
        // })
        //console.log('quering from MongoDB server')
        console.log('==========')
        const createdData=await urlModel.create(data)
        await SET_ASYNC(`${longUrl}`,"EX",50, JSON.stringify(data), "Ex",50);
        console.log('quering from MongoDB server')
        return res.status(201).send({status:true,data:createdData})
    } catch (error) {
        return res.status(500).send({status:false,message:error.message})
    }
    
}



const getUrl=async function (req,res) {
    try {
        const urlCode=req.params.urlCode
        if (Object.keys(urlCode)==0) {
            return res.status(400).send({status:false,message:'please provide url code in params'})
        }
        let cahcedProfileData = await GET_ASYNC(`${urlCode}`)
        if(cahcedProfileData) {
            console.log('cache data')
            console.log('==========')
            return res.status(302).redirect(JSON.parse(cahcedProfileData))
        }
        const url=await urlModel.findOne({urlCode:urlCode})
        if(!url){
            return res.status(404).send({status:false,message:'no url found with this code,please check input and try again'})
        }
        console.log('quering from MongoDB server')
        console.log('==========')
        await SET_ASYNC(`${urlCode}`, JSON.stringify(url.longUrl),"EX",30)
        return res.status(302).redirect(url.longUrl)

    } catch (error) {
        return res.status(500).send({status:false,message:error.message})
    }
}

// const fetchUrlProfile = async function (req, res) {
//     const urlCode=req.params.urlCode
//     let cahcedProfileData = await GET_ASYNC(`${req.params.urlCode}`)
//     if(cahcedProfileData) {
//       res.send(cahcedProfileData)
//     } else {
//       let url = await urlModel.findOne({urlCode:urlCode});
//       await SET_ASYNC(`${urlCode}`, JSON.stringify(url.longUrl),)
//     //   res.send({ data: profile });
//       res.status(302).redirect(profile.longUrl)
//     }
  
//   };

module.exports={shortenUrl,getUrl};
