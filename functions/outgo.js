import uuid from "uuid";

const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const moment = require ('moment');
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


    if(!value || isNaN(value)) {
        res.status(400).json({error: 'Field value is obligatory and must be numeric'});
    }else if(!description) {
        res.status(400).json({error: 'Field description is obligatory'});
    }else if( ! await checkCategoryExist(categoryId)) {
        res.status(400).json({error: `Category ${categoryId} not exist`});
    }else if(!moment(date, 'DD-MM-YYYY',true).isValid()){
            res.status(400).json({error: `Date: ${date} is not valid format DD-MM-YYYY`});
    }else {

        const category = await getCategory(categoryId);
        const params = {
            TableName: USERS_OUTGO_TABLE,
            Item: {
                Username: USER_NAME,
                OutgoId: uuid.v1(),
                Category: {
                    CategoryId: categoryId,
                    MainCategory: category.MainCategory,
                    SubCategory: category.SubCategory
                },
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

    if(!value || isNaN(value)) {
        res.status(400).json({error: 'Field value is obligatory and must be numeric'});
    }else if(!description) {
        res.status(400).json({error: 'Field description is obligatory'});
    }else if( ! await checkCategoryExist(categoryId)) {
        res.status(400).json({error: `Category ${categoryId} not exist`});
    }else if(!moment(date, 'DD-MM-YYYY',true).isValid()){
        res.status(400).json({error: `Date: ${date} is not valid format DD-MM-YYYY`});
    }else {

        const category = await getCategory(categoryId);

        const params = {
            TableName: USERS_OUTGO_TABLE,
            Key: {
                Username: USER_NAME,
                OutgoId : req.params.outgoId,
            },
            UpdateExpression : 'set #cId = :category, #val = :Value, #desc = :Description, #pl = :Place, #date = :Date',
            ExpressionAttributeNames: { '#cId' : 'category', '#val' : 'Value', '#desc' : 'Description', '#pl' : 'Place', '#date' : 'Date'},
            ExpressionAttributeValues : { ':category' : category, ':Value' : value, ':Description' : description, ':Place' : place, ':Date' : date},
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
    }
})

app.delete('/outgo/:outgoId', async function (req,res){

    const {outgoId} = req.params;

    const params = {
        TableName: USERS_OUTGO_TABLE,
        Key: {
            Username: USER_NAME,
            OutgoId : outgoId,
        }
    };

    try{
        await dynamoDbLib.call("delete", params);
        res.json("Delete outgo with success").status(200);
    }catch (e) {
        console.log(e);
        res.status(400).json({ error: 'Can not delete outgo '});
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

async function getCategory(categoryId) {
    const categoryParams = {
        TableName: USERS_CATEGORY_TABLE,
        Key: {
            Username: USER_NAME,
            CategoryId: categoryId,
        }
    }

    try {
        const result = await dynamoDbLib.call("get", categoryParams);
        delete result.Item["Label"];
        delete result.Item["createdAt"];
        delete result.Item["Username"];
        return result.Item;
    } catch (e) {
        console.log(e);
        return null;
    }
}

module.exports.handler = serverless(app);