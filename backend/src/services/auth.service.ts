export type CreateAccountParams = {
    email: string,
    password: string,
    userAgent?: string
};

export const createAccount =  async (data: CreateAccountParams) => {
    //verify existing user doesn't exist

    //create user
    
    //create verification code

    //send verification email

    //create session

    //sign access token & refresh token

    //return user & tokens
}