import uuid from "uuid";

const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
import AWS from "aws-sdk";
import * as dynamoDbLib from "../libs/dynamoDb-lib";


const USERS_OUTGO_TABLE = process.env.USERS_OUTGO_TABLE;
const USER_NAME = process.env.USER_NAME;
AWS.config.update({ region: "eu-west-1" });

app.use(bodyParser.json({ strict: false }));

//GET ALL
app.get('/outgo/',async function (req, res) {

    const params = {
        TableName: USERS_OUTGO_TABLE,
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
        res.status(400).json({ error: 'Can not get all outgoes '});
    }
})

//CREATE SINGLE
app.post('/outgo', async function (req, res) {
    const { categoryId, description,value,date,place } = req.body;

    if(!value) {
        res.status(400).json({error: '"Field value is obligatory'});
    }
    if(!description) {
        res.status(400).json({error: '"Field description is obligatory'});
    }


    const params = {
        TableName: USERS_OUTGO_TABLE,
        Item: {
            Username: USER_NAME,
            OutgoId: uuid.v1(),
            CategoryId: categoryId,
            Value: value,
            Description: description,
            Place: place,
            Date: date,
        },
    };
    try{
        await dynamoDbLib.call("put", params);
        const {OutgoId} = params.Item;
        res.json({ OutgoId }).status(201);
    }catch (e) {
        console.log(e);
        res.status(400).json({ error: 'Could not create outgo' });
    }

})

module.exports.handler = serverless(app);