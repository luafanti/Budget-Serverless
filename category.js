const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
import AWS from "aws-sdk";
import * as dynamoDbLib from "./libs/dynamoDb-lib";
import uuid from "uuid";

const USERS_CATEGORY_TABLE = process.env.USERS_CATEGORY_TABLE;
const USER_NAME = process.env.USER_NAME;
AWS.config.update({ region: "eu-west-1" });
const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ strict: false }));

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


//POST SINGLE
 app.post('/category', async function (req, res) {
    console.log(`HELO POST`)
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
                createdAt: Date.now()
            },
        };
        try{
            await dynamoDbLib.call("put", params);
            const {CategoryId} = params.Item;
            console.log(`ID : ${CategoryId}`);
            res.json({ CategoryId }).status(201);
        }catch (e) {
            console.log(e);
            res.status(400).json({ error: 'Could not create category' });
        }
    }
})











// Create User endpoint
app.post('/users', function (req, res) {
    const { userId, name } = req.body;
    if (typeof userId !== 'string') {
        res.status(400).json({ error: '"userId" must be a string' });
    } else if (typeof name !== 'string') {
        res.status(400).json({ error: '"name" must be a string' });
    }

    const params = {
        TableName: USERS_TABLE,
        Item: {
            Username: USER_NAME,
            CategoryID: name,
        },
    };

    dynamoDb.put(params, (error) => {
        if (error) {
            console.log(error);
            res.status(400).json({ error: 'Could not create user' });
        }
        res.json({ userId, name });
    });
})

// Get User endpoint
app.get('/users/:userId', function (req, res) {
    const params = {
        TableName: USERS_TABLE,
        Key: {
            userId: req.params.userId,
        },
    }


    dynamoDb.get(params, (error, result) => {
        if (error) {
            console.log(error);
            res.status(400).json({ error: 'Could not get user' });
        }
        if (result.Item) {
            const {userId, name} = result.Item;
            res.json({ userId, name });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    });
})

module.exports.handler = serverless(app);