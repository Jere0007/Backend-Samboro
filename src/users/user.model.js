import { Schema, model } from "mongoose";

const UserSchema = Schema({
    profilePhoto: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        maxLength: [25, 'Cannot exceed 25 characters']
    },
    surname: {
        type: String,
        required: [true, 'Surname is required'],
        maxLength: [25, 'Cannot exceed 25 characters']
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        maxLength: [25, 'Cannot exceed 25 characters']
    },
    email: {
        type: String,
        required: [true, 'email is required']
    },
    password: {
        type: String,
        required: [true, 'password is required']
    },
    role: {
        type: String,
        required: true,
        enum: [
            'DEVELOPER_ROLE',
            'ADMIN_IT_ROLE', 
            "ADMIN_MARKETING_ROLE", 
            "ADMIN_RRHH_ROLE",  
            "RRHH_ROLE", 
            "IT_ROLE", 
            "MARKETING_ROLE",
            'OPERADOR_ROLE',
        ]
    },
    birthday: {
        type: Date,
        required: false
    },
    permissions: {
        type: [String], 
        default: []
    },
    status: {
        type: Boolean,
        default: true
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    }
},
    {
        timestamps: true,
        versionKey: false
    }
);

UserSchema.methods.toJSON = function() {
    const { __v, password, _id, ...usuario } = this.toObject();
    usuario.uid = _id;
    return usuario;
}

export default model('user', UserSchema);