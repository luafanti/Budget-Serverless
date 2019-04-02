import uuid from "uuid";

const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
import AWS from "aws-sdk";
import * as dynamoDbLib from "../libs/dynamoDb-lib";


const USERS_OUTGO_TABLE = process.env.USERS_OUTGO_TABLE;
const USERS_CATEGORY_TABLE = process.env.USERS_CATEGORY_TABLE;
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
        res.status(400).json({error: 'Field value is obligatory'});
    }else if(!description) {
        res.status(400).json({error: 'Field description is obligatory'});
    }else if( ! await checkCategoryExist(categoryId)){
        res.status(400).json({error: `Category ${categoryId} not exist`});
    }else {

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
    }
})

app.put('/outgo/:outgoId', async  function (req,res) {

    const { categoryId, description,value,date,place } = req.body;

    const params = {
        TableName: USERS_OUTGO_TABLE,
        Key: {
            Username: USER_NAME,
            OutgoId : req.params.outgoId,
        },
        UpdateExpression : 'set #cId = :CategoryId, #val = :Value, #desc = :Description, #pl = :Place, #date = :Date',
        ExpressionAttributeNames: { '#cId' : 'CategoryId', '#val' : 'Value', '#desc' : 'Description', '#pl' : 'Place', '#date' : 'Date'},
        ExpressionAttributeValues : { ':CategoryId' : categoryId, ':Value' : value, ':Description' : description, ':Place' : place, ':Date' : date},
        ReturnValues: "ALL_NEW"
    };

    try{
        const result = await dynamoDbLib.call("update", params);
        console.log(`Update outgo OK,  result = ${JSON.stringify(result)}`)
        res.json(result.Attributes).status(200);
    }catch (e) {
        console.log(e);
        res.status(400).json({ error: 'Could not update outgo' });
    }

})


async function checkCategoryExist (categoryId)  {

    const params = {
        TableName: USERS_CATEGORY_TABLE,
        Key: {
            Username: USER_NAME,
            CategoryId : categoryId,
        }
    };
    try{
        const result = await dynamoDbLib.call("get", params);
        if(result.Item !== undefined && result.Item !== null){
            console.log(`Category with Id [${categoryId}] exist`)
            return true
        }else{
            console.log(`Category with Id [${categoryId}] not exist`)
            return false
        }
    }catch (e) {
        console.log(`Error during searching for category ${e}`)
        return false
    }
}
module.exports.handler = serverless(app);