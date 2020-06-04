const express = require('express');
const bodyParser = require('body-parser');
const mongo = require('mongodb');
const dotenv = require('dotenv').config();
const path = require('path');

let app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.use(express.static(__dirname + '/public'));

let dbString = process.env.DB;

mongo.connect(dbString,(err,data)=>{
  if (err) throw err;
  let db = data.db('Casino');

app.get('/api/gamesFloor/:user',(req,res)=>{
db.collection('Users').findOne({User:req.params.user},(err,doc)=>{
  if (err) throw err;
  if(doc){
    res.json({cash:doc.CurrentCash});
    return;
  }
  else{
    res.json({errMSG:"Invalid user detected."});
  }
})
})

app.get('/api/highScores',(req,res)=>{
  db.collection('HighScore').find({}).toArray((err,doc)=>{
    if (err) throw err;
    let winners ={
      score: doc[0].HighScore
    }
    res.json({winners});
    return;
  })
})

app.post('/api/login',(req,res)=>
{
  let user = req.body.existingUid;
  let pwd = req.body.pwd;
  db.collection('Users').findOne({User:user},(err,doc)=>{
    if (err) throw err;
    if(doc == null){
      res.json({errMsg:"User not found. Sign up today!"})
      return;
    }
    if(doc.Password != pwd){
      res.json({errMsg:"Invalid Password"});
      return;
    }
    else{
      res.json({
        url:`/gamesFloor/${user}`,
        auth: true
      });
      return;
    }
  })

})

app.post('/api/signup',(req,res)=>{
  let user = req.body.newUid;
  let pwd = req.body.pwd;
  db.collection('Users').findOne({User:user},(err,doc)=>{
    if(doc){
      res.json({errMSG:'User already exists!'});
      return;
    }
  })
  db.collection('Users').insertOne({User:user,Password:pwd, CurrentCash:800},(err,doc)=>{
    if (err) throw err;
    res.redirect(`/${user}/gamesFloor`);
    return;
  })
})

app.post('/api/newGame',(req,res)=>{

  let user = req.body.user;
 db.collection('Users').findOneAndUpdate({User:user},{$set:{CurrentCash:800}},{upsert:true},(err,doc)=>{
   if (err) throw err;
   if (doc){
     res.json({msg:"New Game!"});
     return;
   }
   if(doc == null){
     res.json({msg:"Couldn't find user... somehow... Hacks!!"});
     return;
   }
 })
})

app.post('/api/spin',(req,res)=>{
  let payload = req.body;
  const winChance = 0.3;
  let winResult = Math.random();
  let winMulti = Math.random();

  if(payload.cash <= 0){
    res.json({msg:"You're all out of money, friend!"});
    return;
  }

  if(winResult < winChance){
      switch (true){
        case (winResult >= 0.95):
        payload.multiplier += 10;
        break;
        case (winResult >= 0.90):
        payload.multiplier += 8;
        break;
        case (winResult >= 0.5):
        payload.multiplier += 3;
        break;
        default:
        break;
      }

    let winnings = (payload.bet * payload.multiplier)*2;
    db.collection('Users').findOne({User:payload.user},(err,doc)=>{
      if (err) throw err;
      let currentCash = doc.CurrentCash + winnings;

    db.collection('Users').findOneAndUpdate({User:payload.user},{$set:{CurrentCash:currentCash}},{upsert:true},(err,doc)=>{
      if (err) throw err;
      res.json({msg:`YOU WON ${winnings}$!!!`});
      return;
    })
      })
  }
  else{
    db.collection('Users').findOne({User:payload.user},(err,doc)=>{
      if (err) throw err;
      let currentCash = doc.CurrentCash - payload.bet;
      db.collection('Users').findOneAndUpdate({User:payload.user},{$set:{CurrentCash:currentCash}},{upsert:true},(err,doc)=>{
        if (err) throw err;
        res.json({msg:`Tough luck! Try again?`});
        return;
      })
  })
}
})

app.post('/api/setHighScore',(req,res)=>{
  let newScores = req.body;
db.collection('HighScore').findOneAndUpdate({id:"5ed92a948ff8354dd518cb7a"},{$set:{HighScore:newScores}},{upsert:true},(err,doc)=>{
  if (err) throw err;
  console.log(doc);
  return;
})
})
})

//app.get('*', (req,res) => res.sendFile(path.join(__dirname+'/public/index.html')))

app.listen(3001,()=>{console.log('Listening on 3001!')});

module.exports = app;
