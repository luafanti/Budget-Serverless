const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
import AWS from "aws-sdk";
import * as dynamoDbLib from "../libs/dynamoDb-lib";
import uuid from "uuid";

const USERS_CATEGORY_TABLE = process.env.USERS_CATEGORY_TABLE;
const USER_NAME = process.env.USER_NAME;
AWS.config.update({ region: "eu-west-1" });

app.use(bodyParser.json({ strict: false }));


app.get('/favicon.ico',async function (req, res) {
    res.json("OK").status(204);
})


//GET SINGLE
app.get('/category/:categoryId',async function (req, res) {
    const params = {
        TableName: USERS_CATEGORY_TABLE,
        Key: {
            Username: USER_NAME,
            CategoryId : req.params.categoryId,
        }
    }

    try{
        const result = await dynamoDbLib.call("get", params);
        if(result.Item){
            res.json(result.Item).status(200);
        }else{
            res.status(404).json({ error: 'Category not found' });
        }

    }catch (e) {
        console.log(e);
        res.status(400).json({ error: 'Can not get category '});
    }
})

//GET ALL
app.get('/category/',async function (req, res) {
    const params = {
        TableName: USERS_CATEGORY_TABLE,
        KeyConditionExpression: "Username = :userName",
        ExpressionAttributeValues: {
            ":userName": USER_NAME
        }
    }

    try{
        const result = await dynamoDbLib.call("query", params);
        res.json(result.Items).status(200);
    }catch (e) {
        console.log(e);
        res.status(400).json({ error: 'Can not get all categories '});
    }
})


//CREATE SINGLE
 app.post('/category', async function (req, res) {
    const { mainCategory, subCategory,label } = req.body;

    if(!mainCategory){
        res.status(400).json({ error: '"Field mainCategory is obligatory' });
    }else{

        const params = {
            TableName: USERS_CATEGORY_TABLE,
            Item: {
                Username: USER_NAME,
                CategoryId: uuid.v1(),
                MainCategory: mainCategory,
                SubCategory: subCategory,
                Label: label,
                CreatedAt: Date.now()
            },
        };
        try{
            await dynamoDbLib.call("put", params);
            const {CategoryId} = params.Item;
            res.json({ CategoryId }).status(201);
        }catch (e) {
            console.log(e);
            res.status(400).json({ error: 'Could not create category' });
        }
    }
})

//UPDATE SINGLE
app.put('/category/:categoryId', async function (req, res) {
    const { mainCategory, subCategory,label } = req.body;

    var params = {
        TableName : USERS_CATEGORY_TABLE,
        Key: {
            Username: USER_NAME,
            CategoryId : req.params.categoryId,
        },
        UpdateExpression : 'set #mc = :MainCategory, #sc = :SubCategory, #l = :Label',
        ExpressionAttributeNames: { '#mc' : 'MainCategory', '#sc' : 'SubCategory', '#l' : 'Label' },
        ExpressionAttributeValues : { ':MainCategory' : mainCategory, ':SubCategory' : subCategory, ':Label' : label},
        ReturnValues: "ALL_NEW"
    };

    try{
        const result = await dynamoDbLib.call("update", params);
        console.log(`Update result = ${JSON.stringify(result)}`)
        res.json(result.Attributes).status(200);
    }catch (e) {
        console.log(e);
        res.status(400).json({ error: 'Could not update category' });
    }
})

//DELETE SINGLE
app.delete('/category/:categoryId',async function (req, res) {
    const {categoryId} = req.params;
    
    const params = {
        TableName: USERS_CATEGORY_TABLE,
        Key: {
            Username: USER_NAME,
            CategoryId : categoryId,
        }
    };

    try{
        await dynamoDbLib.call("delete", params);
        res.json("Deletes success").status(200);
    }catch (e) {
        console.log(e);
        res.status(400).json({ error: 'Can not delete category '});
    }
})



module.exports.handler = serverless(app);