import { Schema, model } from "mongoose";

const CommentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    text: {
        type: String,
        required: true
    },
    publication: {
        type: Schema.Types.ObjectId,
        ref: "publication",
        required: true
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    postedComment: {
        type: String,
        default: () => {
            const now = new Date();
            return now.toLocaleString("es-GT", { // 👈 zona horaria Guatemala
                dateStyle: "medium",
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
);

export default model('comment', CommentSchema);