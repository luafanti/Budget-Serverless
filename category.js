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


//GET
app.get('/category', function (req, res) {
    console.log(`HELO GET`)

    const params = {
        TableName: USERS_CATEGORY_TABLE,
        Key: {
            userId: req.params.userId,
        },
    }

    console.log(`DB1 ${JSON.stringify(params)}`)
    res.send('Hello WorlZZZd!')
})



//POST
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


        // dynamoDb.put(params, (error) => {
        //     if (error) {
        //         console.log(error);
        //         res.status(400).json({ error: 'Could not create category' });
        //     }
        //     const {CategoryId} = params.Item;
        //     console.log(`ID : ${CategoryId}`);
        //     res.json({ CategoryId }).status(201);
        // });


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