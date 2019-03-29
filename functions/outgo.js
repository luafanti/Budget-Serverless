const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
import AWS from "aws-sdk";
import * as dynamoDbLib from "../libs/dynamoDb-lib";


const USERS_CATEGORY_TABLE = process.env.USERS_CATEGORY_TABLE;
const USER_NAME = process.env.USER_NAME;
AWS.config.update({ region: "eu-west-1" });
const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ strict: false }));

//GET ALL
app.get('/outgo/',async function (req, res) {
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

module.exports.handler = serverless(app);