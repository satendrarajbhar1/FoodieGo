import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    fullName :{
       type:String,
       required:true
    },
    email :{
        type : String,
        required : true,
        unique : true
    },

    // Google users ka password nahi hota. Query me by default nahi aata.
    password:{
        type:String,
        select:false
    },
    mobile :{
        type : String,
        required : true,
    },
    role :{
        type : String,
        enum: ["user" ,"owner" , "deliveryBoy"],
        required: true,
    },
    resetOtp : {
        type : String
    },

    isOtpVerified : {
        type : Boolean,
        default : false
    },
    otpExpires :{
        type : Date
    },

    // Sirf deliveryBoy ke liye
    isAvailable : {
        type : Boolean,
        default : false
    },

    // Rider ki last known location: [longitude, latitude]
    location : {
        type : { type : String, enum : ["Point"] },
        coordinates : { type : [Number], default : undefined }
    }

} , {timestamps : true})

userSchema.index({ location : "2dsphere" })

const User = mongoose.model("User" , userSchema)

export default User;