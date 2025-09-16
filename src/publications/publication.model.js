import { Schema, model } from "mongoose";

const PublicationSchema = Schema({
    description: {
        type: String,
        required: false
    },
    image: {
        type: String,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    area: { 
        type: String, 
        enum: ["IT", "MARKETING", "RRHH"], // o más módulos según necesites
        required: true
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    comments:[{
        type: Schema.Types.ObjectId,
        ref: "comment"
    }],
    publishedPublication: {
        type: String,
        default: () => {
            const now = new Date();
            return now.toLocaleString("es-GT", {
                dateStyle: "long",
                timeStyle: "short",
                hour12: false
            });
        }
    },
    status: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true,
        versionKey: false
    }
)

export default model('publication', PublicationSchema);