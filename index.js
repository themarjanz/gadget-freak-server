const express = require('express')
const app = express();
var cors = require('cors')
app.use(cors())
const jwt = require('jsonwebtoken');
require('dotenv').config()
app.use(express.json())
const port = 5000


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ifk5b1m.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        console.log('db connected');
        const productCollection = client.db("gadgetFreak").collection("products");
        const orderCollection = client.db("gadgetFreak").collection("orders");

        // for json web token
        app.post("/login", (req, res) => {
            const email = req.body;
            // console.log(email);
            const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);

            res.send({ token })
        })

        app.post("/uploadPd", async (req, res) => {
            const product = req.body;

            const tokenInfo = req.headers.authorization;
            // console.log(tokenInfo);
            const [email, accessToken] = tokenInfo.split(" ")
            // verifu email call
            const decoded = verifyToken(accessToken)

            if (email === decoded.email) {
                const result = await productCollection.insertOne(product);
                res.send({ success: 'Product Upload Succsessfully' })
            }
            else {
                res.send({ success: "UnAuthoraized Access" })
            }

        })

        app.get("/products", async (req, res) => {
            const products = await productCollection.find({}).toArray();
            res.send(products);

        })

        app.post("/addOrder", async (req, res) => {
            const orderInfo = req.body;
            const result = await orderCollection.insertOne(orderInfo);
            res.send({ success: 'Order Compelete' })
        })

        app.get("/orderList", async (req, res) => {
            const tokenInfo = req.headers.authorization;
            console.log(tokenInfo);
            const [email, accessToken] = tokenInfo.split(" ")
            // verifu email call
            const decoded = verifyToken(accessToken)

            if (email === decoded.email) {
                const orders = await orderCollection.find({ email: email }).toArray();
                res.send(orders);
            }
            else {
                res.send({ success: "UnAuthoraized Access" })
            }

        })
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

// verify token function
function verifyToken(token) {
    let email;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            email = 'Invalid email'
        }
        if (decoded) {
            console.log(decoded);
            email = decoded
        }

    });
    return email;
}