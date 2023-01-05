const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const express = require('express');

const packageDefinitionReci = protoLoader.
                            loadSync(path.join(__dirname, '../protos/recipes.proto'));
const packageDefinitionProc = protoLoader.
                            loadSync(path.join(__dirname, '../protos/processing.proto'));
const recipesProto = grpc.loadPackageDefinition(packageDefinitionReci);
const processingProto = grpc.loadPackageDefinition(packageDefinitionProc);


const recipesStub = new recipesProto.Recipes('0.0.0.0:50051',
                        grpc.credentials.createInsecure());
const processingStub = new processingProto.Processing('0.0.0.0:50052',
                        grpc.credentials.createInsecure());


const app = express();
app.use(express.json());

const restPort = 5000;
let orders = {};

function processAsync(order) {
    recipesStub.find({ id: order.productId }, (err, recipe) => {
        if(err) return;

        orders[order.id].recipe = recipe;
        const call = processingStub.process({
            orderId: order.id,
            recipeId: recipe.id
        });
        call.on('data', (statusUpdate) => {
            orders[order.id].status = statusUpdate.status;
        });
    });
}

app.post('/orders', (req, res) => {
    if(!req.body.productId) {
        res.status(400).send('Product identifier is not set');
        return;
    }
    let orderId = Object.keys(orders).length + 1;
    let order = {
        id: orderId,
        status: 0,
        productId: req.body.productId,
        createdAt : new Date().toLocaleString()
    };
    orders[order.id] = order;
    processAsync(order);
    res.send(order);
});

app.get('/orders/:id', (req, res) => {
    if(!req.params.id) {
        res.status(400).send('Order not found');
        return;
    }
    res.send(orders[req.params.id]);
});

app.listen(restPort, () => {
  console.log(`RESTful API is listening on port ${restPort}`)
});

