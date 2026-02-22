import express from "express";
import 'dotenv/config';
import cors from "cors";
import connectToDatabase from "./config/db";
import { PORT, NODE_ENV, APP_ORIGIN } from "./constants/env";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandler";
import catchErrors from "./utils/catchErrors";
import { OK } from "./constants/http";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import authenticate from "./middleware/authenticate";
import sessionsRoutes from "./routes/sessions.route";

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

//Routes
app.use('/auth', authRoutes);

//Protected Routes
app.use('/user', authenticate, userRoutes);
app.use('/sessions',authenticate, sessionsRoutes);

//Error Handler Middleware
app.use(errorHandler);

const startServer = async () => {
    try {
        await connectToDatabase();
        app.listen(PORT, () => {
            console.log(`Server is running on PORT ${PORT} in ${NODE_ENV} environment.`);
        });
    } catch (error) {
        console.error('Failed to start server', error);
        process.exit(1);
    }
};

startServer();