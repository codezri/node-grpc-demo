const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.
                            loadSync(path.join(__dirname, '../protos/recipes.proto'));
const recipesProto = grpc.loadPackageDefinition(packageDefinition);

const RECIPES = [
    {
        id: 100,
        productId: 1000,
        title: 'Pizza',
        notes: 'See video: pizza_recipe.mp4. Use oven No. 12'
    },
    {
        id: 200,
        productId: 2000,
        title: 'Lasagna',
        notes: 'Ask from John. Use any oven, but make sure to pre-heat it!'
    }
];

function findRecipe(call, callback) {
    let recipe = RECIPES.find((recipe) => recipe.productId == call.request.id);
    if(recipe) {
        callback(null, recipe);
    }
    else {
        callback({
            message: 'Recipe not found',
            code: grpc.status.INVALID_ARGUMENT
        });
    }
}

const server = new grpc.Server();
server.addService(recipesProto.Recipes.service, { find: findRecipe });
server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
    server.start();
});
