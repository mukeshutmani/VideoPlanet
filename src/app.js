import express from 'express';
import cors from 'cors'; 
import cookieParser from 'cookie-parser';

const app = express();

 
app.use(cors({
 origin: process.env.CORS_ORIGIN,
 credentials:true
})) 

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended: true, limit:"16kb"}))
//  save assests like image pdf etc on your local server 
app.use(express.static("public"))

// through the server you want to apply curd  operation on cookies at user browser by using cookie-parser
app.use(cookieParser())
 

export {app}
