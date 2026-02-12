import express from "express";
import 'dotenv/config';
import cors from "cors";
import connectToDatabase from "./config/db";
import { PORT, NODE_ENV, APP_ORIGIN } from "./constants/env";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandler";
import catchErrors from "./utils/catchErrors";
import { OK } from "./constants/http";

const app = express();

//Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors({
    origin: APP_ORIGIN,
    credentials: true,
}));
app.use(cookieParser());

app.get('/', catchErrors(async (req,res) => {
    res.status(OK).send({msg : "healty"});
}));

//Error Handler Middleware
app.use(errorHandler);

app.listen(PORT, async () => {
    console.log(`Server is running PORT : ${PORT} in ${NODE_ENV} environment`);
    await connectToDatabase();
});