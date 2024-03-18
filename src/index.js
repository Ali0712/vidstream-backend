import dotenv from 'dotenv';
dotenv.config({path : '.env'})
import connectDB from './db/dbConnection.js';
import { app } from './app.js';
import { PORT } from './constants.js';

connectDB()
.then(() => {
    app.listen(PORT, ()=>{
        console.log(`Server is listening on PORT: ${PORT}`)
    })
})
.catch((error)=>{
    console.log("MongoDB error occured", error)
})