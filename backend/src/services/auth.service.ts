import VerificationCodeType from "../constants/verificationCodeType";
import SessionModel from "../models/session.mode";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verificationCode.model";
import { oneYearFromNow } from "../utils/date";
import { JWT_REFRESH_TOKEN, JWT_SECRET } from "../constants/env";
import jwt from "jsonwebtoken";
import { CONFLICT } from "../constants/http";
import appAssert from "../utils/appAssert";

export type CreateAccountParams = {
    email: string,
    password: string,
    userAgent?: string
};

export const createAccount =  async (data: CreateAccountParams) => {
    //verify existing user doesn't exist
    const existingUser = await UserModel.exists({
        email: data.email,
    });

    appAssert( !existingUser, CONFLICT, "Email already in use")

    //create user
    const user = await UserModel.create({
        email: data.email,
        password: data.password,
    });
    //create verification code
    const verificationCode = await VerificationCodeModel.create({
        userId: user._id,
        type: VerificationCodeType.EmailVerification,
        expiresAt: oneYearFromNow()
    });
    //send verification email

    //create session
    const session = await SessionModel.create({
        userId: user._id,
        userAgent: data.userAgent
    });
    //sign access token & refresh token
    const refreshToken = jwt.sign(
        { sessionId: session._id },
        JWT_REFRESH_TOKEN, {
            audience: ['user'],
            expiresIn: "30d",
        }
    );

    const accessToken = jwt.sign(
        {
            userId: user._id,
            sessionId: session._id
        },
        JWT_SECRET,
        {
            audience: ["user"],
            expiresIn: "15m",
        }
    )
    //return user & tokens
    return {
        user: user.omitPassword(),
        accessToken,
        refreshToken
    }
}