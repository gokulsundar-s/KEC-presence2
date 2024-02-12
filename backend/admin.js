const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3003;
const jwt = require('jsonwebtoken');

app.use(bodyParser.json());
app.use(cors());

const secretKey = "SZ9NkP*va21$FCw";

// mongoose.connect('mongodb+srv://kecpresence:kecpresence@cluster.tporjml.mongodb.net/kecpresence');
mongoose.connect('mongodb://localhost:27017/kecpresence');

const Users = mongoose.model('users', {
    usertype: String,
    department: String,
    name: String,
    roll: String,
    mail: String,
    year: String,
    section: String,
    phone: String,
    pphone: String,
    pmail: String,
    password: String,
  });

const Request = mongoose.model('request', {
    name: String,
    roll: String,
    department: String,
    year: String,
    section: String,
    reqtype: String,
    reason: String,
    fromdate: String,
    todate: String,
    session: String,
    advoicerstatus: String,
    yearinchargestatus: String,
  });

app.post('/login', async (req, res) => {
    const { mail, password } = req.body;
    const user = await Users.findOne({ mail: mail , password: password });
    
    if(user){
        const token = jwt.sign({ usertype: user.usertype, department: user.department, name: user.name, roll: user.roll, mail: user.mail, year: user.year, section: user.section, phone: user.phone, pphone: user.pphone, pmail: user.pmail }, secretKey, { expiresIn: '1d' });
        res.json(token);
    }
    else{
        res.json("failed");
    }
});

app.post('/adminadduser', async (req, res) => {
    const { usertype, department, name, roll, mail, year,section, phone, pphone, pmail} = req.body;
    const user = await Users.findOne({ mail: mail });
    
    if(user){
        res.json("exists");
    }

    else{
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let password = "";
        length = 8;
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset.charAt(randomIndex);
        }
    
        const newUser = new Users({ usertype, department, name, roll, mail, year,section, phone, pphone, pmail, password });
        await newUser.save();
        
        if(newUser._id){
            res.json("success");
        }
        else{
            res.json("error");
        }
    }
});

app.post('/adminsearchuser', async (req, res) => {
    const { usertype, mail } = req.body;
    const user = await Users.findOne({ usertype, mail });
    res.json(user);
});

app.post('/adminedituser', async (req, res) => {
    const { usertype, department, name, roll, mail, year,section, phone, pphone, pmail } = req.body;
    const user = await Users.findOne({ usertype, mail });
    
    if(user){
        const update = await Users.updateOne({usertype, mail}, {$set:{ department, name, roll, year,section, phone, pphone, pmail }});
        if(update.modifiedCount == "0"){
            res.json("false");
        }
        else if(update.modifiedCount != "0"){
            res.json("true");
        }
    }
});

app.post('/admindeleteuser', async (req, res) => {
    const { mail } = req.body;
    const user = await Users.findOne({ mail });

    if(!user){
        res.json("not-found")
    }
    else{
        const del = await Users.deleteOne({ mail });
        if(del.acknowledged === true){
            res.json("success");
        }
        else{
            res.json("error")
        }
    } 
});

app.post('/studentrequest', async (req, res) => {
    const { name, roll, department, year, section, reqtype, reason, fromdate, todate, session, advoicerstatus, yearinchargestatus } = req.body;
    const check = await Request.findOne({ fromdate: { $lte: fromdate }, todate: { $gte: todate }});
    if(!check){
        const newReq = new Request({ name, roll, department, year, section, reqtype, reason, fromdate, todate, session, advoicerstatus, yearinchargestatus });
        await newReq.save();
        
        if(newReq._id){
            res.json("success");
        }
        else{
            res.json("failure");
        }
    }
    else{
        res.json("exists");
    }
});

app.post('/studentshistory', async (req, res) => {
    const { roll } = req.body;
    const items = await Request.find({ roll });
    res.json(items);
});

app.post('/advoicerrequests', async (req, res) => {
    const { department, year, section } = req.body;
    const items = await Request.find({department, year, section, advoicerstatus:"pending"});
    res.json(items);
});

app.post('/advoicerhistory', async (req, res) => {
    const { department, year, section } = req.body;
    const items = await Request.find({department, year, section, $or:[{advoicerstatus:"accepted"}, {advoicerstatus:"rejected"} ]});
    res.json(items);
});

app.post('/yearinchargerequests', async (req, res) => {
    const { department, year } = req.body;
    const items = await Request.find({department, year, advoicerstatus:"accepted", yearinchargestatus:"pending"});
    res.json(items);
});

app.post('/yearinchargehistory', async (req, res) => {
    const { department, year } = req.body;
    const items = await Request.find({department, year, advoicerstatus: 'accepted', $or:[{yearinchargestatus:"accepted"}, {yearinchargestatus:"rejected"}] });
    res.json(items);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});