const urlModel = require("../Models/urlModel");
const shortId=require("shortid")
const validUrl=require("valid-url");
const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
  };

  const redis = require("redis");

  const { promisify } = require("util");
  
  //Connect to redis
  const redisClient = redis.createClient(
    13190,
    "redis-13190.c301.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("gkiOIPkytPI3ADi14jHMSWkZEo2J5TDG", function (err) {
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
            return res.status(400).send({status:false,message:'please provide a valid url2'})
        }
        const checkUrl = await urlModel.GET_ASYNC(`${longUrl}`)
        const data1 = JSON.parse(checkUrl)
        if(data1){
            return res.status(200).send({status:false, data1:{longUrl:data1.longUrl, shortId:data1.shortUrl,urlCode:data1.urlCode}})
        }    
        
        const urlCode=shortId.generate()
        const shortUrl="http://localhost:3000/" + urlCode
        data['shortUrl']=shortUrl
        data['urlCode']=urlCode
    
        const createdData=await urlModel.create(data)
        await SET_ASYNC(`${createdData.longUrl}`,JOSN.stringify(createdData))
        return res.status(201).send({status:true, message:"You created Short Url for this Long Url",data:createdData})
    } catch (error) {
        return res.status(500).send({status:false,message:error.message})
    }
    
}
// const fetchurlProfile = async function (req, res) {
//     let cahcedurl = await GET_ASYNC(`${req.params.urlCode}`)
//     if(cahcedurl) {
//       res.send(cahcedurl)
//     } else {
//       let url = await urlModel.findOne(req.params.url);
//       await SET_ASYNC(`${req.params.url}`, JSON.stringify(url))
//       res.send({ data: profile });
//     }
  
//   };
//   ``

const getUrl=async function (req,res) {
    try {
        const urlCode=req.params.urlCode
        if (Object.keys(urlCode)==0) {
            return res.status(400).send({status:false,message:'please provide url code in params'})
        }
        const url=await urlModel.findOne({urlCode:urlCode})
        if(!url){
            return res.status(404).send({status:false,message:'no url found with this code,please check input and try again'})
        }
        return res.status(302).redirect(url.longUrl)
        
    } catch (error) {
        return res.status(500).send({status:false,message:error.message})
    }
}

//   module.exports.createAuthor = createAuthor;
//   module.exports.fetchAuthorProfile = fetchAuthorProfile;

module.exports={shortenUrl,getUrl};
