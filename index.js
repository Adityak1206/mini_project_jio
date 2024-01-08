const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Joi=require('joi');

const app = express();
const PORT = 3000;

mongoose.connect('mongodb://127.0.0.1:27017/user_management')
.then(()=>{
    console.log('Connection Open !!')
})
.catch(err=>{
    console.log('Oh No Error!')
    console.log(err)
})

const userSchema = new mongoose.Schema({
    userID: {
      type: Number,
      unique: true,
    },
    name: String,
    lastName: String,
    age: Number,
    location: String,
    interests: String,
    income: Number
  });

// Pre-save middleware to automatically generate userID
userSchema.pre('save', async function (next) {
    if (this.isNew) {
      try {
        const lastUser = await User.findOne({}, {}, { sort: { 'userID': -1 } });
        if (lastUser) {
          this.userID = lastUser.userID + 1;
        } else {
          this.userID = 1;
        }
        next();
      } catch (error) {
        next(error);
      }
    } else {
      next();
    }
  });

const User = mongoose.model('User', userSchema);

app.use(bodyParser.json());

//Middleware i created for authentication
const authenticationMiddleware = (req, res, next) => {
    const authHeaderValue = req.header('Auth');
    const expectedAuthValue = 'Aditya_Backend'; 
  
    if (authHeaderValue === expectedAuthValue) {
      next();
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
};

// JOI Payload validation schema
const userSchemaValidation = Joi.object({
    name: Joi.string().required(),
    lastName: Joi.string().required(),
    age: Joi.number().required(),
    location: Joi.string().required(),
    interests: Joi.string().required(),
    income: Joi.number().required()
  });

// API : Create new user
app.post('/api/users', authenticationMiddleware, async (req, res) => {
    try {
      const { error } = userSchemaValidation.validate(req.body);
     if (error) {
          return res.status(400).json({ message: 'Validation error', error: error.details });
        }

      const newUser = new User(req.body);
      await newUser.save();
      res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (err) {
      res.status(400).json({ message: 'Error creating user', error: err.message });
    }
  });

// API : update user by userID
app.put('/api/users/:userID', authenticationMiddleware , async (req, res) => {
    const { userID } = req.params;
    try {
      const updatedUser = await User.findOneAndUpdate({ userID: userID }, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User updated successfully', user: updatedUser });
    } catch (err) {
      res.status(400).json({ message: 'Error updating user', error: err.message });
    }
  });

// API : Get user by userID
app.get('/api/users/:userID', authenticationMiddleware , async (req, res) => {
    const { userID } = req.params;
    try {
      const user = await User.findOne({ userID: userID }); 
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (err) {
      res.status(400).json({ message: 'Error fetching user', error: err.message });
    }
  });

// API : GET all users
app.get('/api/users', authenticationMiddleware , async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(400).json({ message: 'Error fetching users', error: err.message });
  }
});

// API : Delete user by userID
app.delete('/api/users/:userID', authenticationMiddleware , async (req, res) => {
    const { userID } = req.params;
    try {
      const deletedUser = await User.findOneAndDelete({ userID: userID });
      if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    } catch (err) {
      res.status(400).json({ message: 'Error deleting user', error: err.message });
    }
  });


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});