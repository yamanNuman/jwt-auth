import VerificationCodeType from "../constants/verificationCodeType";
import SessionModel from "../models/session.mode";
import UserModel from "../models/user.model";
import VerificationCodeModel from "../models/verificationCode.model";
import { ONE_DAY_MS, oneYearFromNow, thirtyDaysFromNow } from "../utils/date";
import { CONFLICT, UNAUTHORIZED } from "../constants/http";
import appAssert from "../utils/appAssert";
import { RefreshTokenPayload, refreshTokenSignOptions, signToken, verifyToken } from "../utils/jwt";

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

    const userId = user._id;
    //create verification code
    const verificationCode = await VerificationCodeModel.create({
        userId,
        type: VerificationCodeType.EmailVerification,
        expiresAt: oneYearFromNow()
    });
    //send verification email

    //create session
    const session = await SessionModel.create({
        userId,
        userAgent: data.userAgent
    });

    //sign access token & refresh token
    const refreshToken = signToken({ sessionId: session._id}, refreshTokenSignOptions)

    const accessToken = signToken({ userId: user._id, sessionId: session._id});

    //return user & tokens
    return {
        user: user.omitPassword(),
        accessToken,
        refreshToken
    }
}

type LoginParams = {
    email:string;
    password:string;
    userAgent?:string;
};

export const loginUser = async ({email, password, userAgent}: LoginParams) => {
    //get the user by email
    const user = await UserModel.findOne({ email });
    appAssert(user, UNAUTHORIZED, "Invalid email or password");

    //validate password from the request
    const isValid = user.comparePassword(password);
    appAssert(isValid, UNAUTHORIZED, "Invalid email or password");
    const userId = user._id;
    
    //create a session
    const session = await SessionModel.create({
        userId,
        userAgent,
    });

    const sessionInfo = {sessionId: session._id};

    //sign access token & refresh token
    const refreshToken = signToken({ sessionId: session._id}, refreshTokenSignOptions)

    const accessToken = signToken({ userId: user._id, sessionId: session._id});

    //return user & tokens
    return {
        user: user.omitPassword(),
        accessToken,
        refreshToken
    }
}

export const refreshUserAccessToken = async (refreshToken: string) => {
    const {
        payload
    } = verifyToken<RefreshTokenPayload>(refreshToken, {
        secret: refreshTokenSignOptions.secret,
    })
    appAssert(payload, UNAUTHORIZED, "Invalid refresh token");

    const now = Date.now();

    const session = await SessionModel.findById(payload.sessionId);
    appAssert(session && session.expiresAt.getTime() > now ,UNAUTHORIZED, "Session expired");

    const sessionNeedsRefresh = session.expiresAt.getTime() - now <= ONE_DAY_MS;
    if(sessionNeedsRefresh) {
        session.expiresAt = thirtyDaysFromNow();
        await session.save();
    }

    const newRefreshToken = sessionNeedsRefresh ? signToken({
        sessionId: session._id
    }, refreshTokenSignOptions) : undefined;

    const accessToken = signToken({
        userId: session.userId,
        sessionId: session._id
    });

    return {
        accessToken,
        newRefreshToken
    }
} 