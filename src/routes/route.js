const express = require('express');
const router = express.Router();
const urlController = require("../controllers/urlController");

router.post("/url/shorten",urlController.shortenUrl)
// router.get("/:urlCode",urlController.getUrl)
router.get("/:urlCode",urlController.getUrl)


// router.post('/authors', authorController.createAuthor)
// router.get('/authors/:authorId', authorController.fetchAuthorProfile)

module.exports=router;

