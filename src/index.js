import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {BrowserRouter as Router, Switch, Route, Redirect} from "react-router-dom";

function Start(){
  return(
    <Router>
    <Switch>
    <Route path="/gamesFloor/:user">
    <GamesFloor/>
    </Route>
    <Route exact path="/">
    <Login />
    </Route>
    </Switch>
    </Router>
  )
}

class Login extends React.Component{
  constructor(props){
    super(props);

  this.state={
    loginInfo:{
      existingUid:'',
      pwd:''
    },
    signupInfo:{
      newUid:'',
      pwd:''
    },
    auth:false,
    url:''
  };

this.handleChangeLogin = this.handleChangeLogin.bind();
this.handleChangeSignup = this.handleChangeSignup.bind();
this.login = this.login.bind();
this.signup = this.signup.bind();
  }

handleChangeLogin=(e)=>{
    e.preventDefault();
    this.setState({
      loginInfo: {...this.state.loginInfo, [e.target.name]:e.target.value}
    })
  }

handleChangeSignup=(e)=>{
  e.preventDefault();
  this.setState({
    signupInfo: {...this.state.signupInfo, [e.target.name]:e.target.value}
  })
}

login=(e)=>{
  e.preventDefault();
  fetch('/api/login',{method:'POST', body:JSON.stringify(this.state.loginInfo),
  headers: {"Content-Type": "application/json"}
})
.then((response)=>{
  return response.json();
})
.then((data)=>{
  console.log(data);
  if(data.auth){
    this.setState({
      auth: true,
      url: data.url
    })
  }
  else{
    alert(data.errMsg);
  }

})

}

signup=(e)=>{
e.preventDefault();
fetch('/api/signup',{method:'POST', body:JSON.stringify(this.state.signupInfo),
headers: {"Content-Type": "application/json"}
})
.then((response)=>{
return response.json();
})
.then((data)=>{
  if(data.errMSG){
    alert(data.errMSG);
  }
})

}

  render(){

    if(this.state.auth){
    return  <Redirect to= {this.state.url} />;
    }

    return(
<div id="page-wrap">


            <header>
            <h1>Welcome to DD's Casino!</h1>
            </header>

          <div className="login-block">
          <h3>New User? Sign up here!</h3>
          <form id="new-user" onSubmit={this.signup}>
          <input type="text" name="newUid" value={this.state.signupInfo.uid} onChange={this.handleChangeSignup} placeholder="Enter user name!" required></input>
          <input type="password" name="pwd" value={this.state.signupInfo.pwd} onChange={this.handleChangeSignup} placeholder="Enter password!" required></input>
          <button type="submit">Sign up!</button>
          </form>

          <h3>Or returning to try your luck again?</h3>
          <form id="existing-user" onSubmit={this.login}>
          <input type="text" name="existingUid" value={this.state.loginInfo.uid} onChange={this.handleChangeLogin} placeholder="Enter user name!" required></input>
          <input type="password" name="pwd" value={this.state.loginInfo.pwd} onChange={this.handleChangeLogin} placeholder="Enter password!" required></input>
          <button type="submit">Login!</button>
          </form>
          </div>
</div>

    )
  }
}

class GamesFloor extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      bet:0,
      multiplier:1,
      currentCash : 50000000,
      user : "",
      spin:0
    }

  this.getUserInfo = this.getUserInfo.bind();
  this.increaseBet = this.increaseBet.bind();
  this.decreaseBet = this.decreaseBet.bind();
  this.spin = this.spin.bind();
  this.newGame = this.newGame.bind();
  this.cashout = this.cashout.bind();
  }

getUserInfo=()=>{

  let currentUser = window.location.pathname;

  fetch(`/api${currentUser}`)
  .then((response)=>{
    return response.json();
  })
  .then((data)=>{
    this.setState({
      currentCash: data.cash,
      user: window.location.pathname.slice(12)
    })
  })

  fetch('/api/highScores')
  .then((res)=>{return res.json()})
  .then((data)=>{
    document.getElementById('winner-list').textContent = '';
    let winners = Object.keys(data.winners.score);
    let scores = Object.values(data.winners.score);
    for(let i=0;i < winners.length; i++){
      let node = document.createElement('li');
      let textNodeWinner = document.createTextNode(winners[i] +" : "+scores[i]+"$");
      node.appendChild(textNodeWinner);
      document.getElementById('winner-list').appendChild(node);
    }
  })
}

increaseBet=(e)=>{
  e.preventDefault();
  if(this.state.currentCash > 0){
  this.setState({
    bet: this.state.bet + 5,
    currentCash:this.state.currentCash - 5
  })
}
}

decreaseBet=(e)=>{
  e.preventDefault();
  if(this.state.bet > 0){
  this.setState({
    bet: this.state.bet - 5,
    currentCash:this.state.currentCash + 5
  })
}
}

spin=(e)=>{
  e.preventDefault();

  let payload={
    bet:this.state.bet,
    user:this.state.user,
    spin:this.state.spin,
    multiplier:this.state.multiplier,
    cash: this.state.currentCash
  }

  fetch('/api/spin',{method: 'POST',body:JSON.stringify(payload),
  headers: {"Content-Type": "application/json"}})
  .then((res)=>{
    return res.json();
  })
  .then((data)=>{
    alert(data.msg);
    this.getUserInfo();
  })
}

newGame=(e)=>{
  e.preventDefault();
  let user = {
    user:this.state.user
  }
  fetch('/api/newGame',{method: 'POST',body:JSON.stringify(user),
  headers: {"Content-Type": "application/json"}})
  .then((res)=>{
    return res.json();
  })
  .then((data)=>{
    console.log("Cash reset!");
    this.getUserInfo();
  })
}

cashout=(e)=>{
  e.preventDefault();
  fetch('/api/highScores')
  .then((res)=>{return res.json()})
  .then((data)=>{
    let newArr = [];
    let scores = Object.values(data.winners.score);

  for(let name in data.winners.score){
    newArr.push([name,data.winners.score[name]])
  }
  newArr = newArr.sort((a,b)=>{return b[1]-a[1]});
  for(let i =0; i < scores.length; i++){
    if(this.state.currentCash > scores[i]){
      newArr.push([this.state.user,this.state.currentCash.toString()]);
      break;
    }
  }
  newArr = newArr.sort((a,b)=>{return b[1]-a[1]});
  newArr.pop();

  let newScores = {};
  newArr.forEach((item) => {
    newScores[item[0]]=item[1];
  });

fetch('/api/setHighScore',{method:'POST',body:JSON.stringify(newScores),
headers: {"Content-Type": "application/json"}})
.then((response)=>{return response.json()})
.then((data)=>{
})
})
  this.getUserInfo();
}

componentDidMount=()=>{
  this.getUserInfo();
}

  render(){
    if(this.state.bet > this.state.currentCash){
      this.setState({
        bet: this.state.currentCash
      })
    if(this.state.bet < 0){
      this.setState({
        bet: 0
      })
    }
    }
    return (
      <div className="page-gamesfloor">

      <div className="user-hud">

      </div>

      <div className="row">
      <div className="col-25">
      <h3>Top Five Winners!</h3>
      <ol id="winner-list">
      </ol>
      </div>
        <div className="col-50">
          <div className="slots">
            <h2>Play the slots!</h2>
              <div id="slot-machine">
                <div id="screen">
                <p>Use your imagination</p>
                </div>
                  <div className="row">
                    <div className="bet-btns">
                      <h5>Increase Bet</h5>
                      <button onClick={this.increaseBet}>5$</button>
                      <h5>Decrease Bet</h5>
                      <button onClick={this.decreaseBet}>5$</button>
                    </div>
                    <div className="spin-reset-btns">
                      <h5>Current Bet:{this.state.bet}</h5>
                      <button onClick={this.spin}>SPIN!!!</button>
                      <h4>New Game?</h4>
                      <button onClick={this.newGame}>Start Over</button>
                    </div>
                  </div>
                  <div className="row">
                  <button onClick={this.cashout}>Cash out!</button>
                  </div>
              </div>
              <h3>Current Cash: {this.state.currentCash}</h3>
              <h3>Player: {this.state.user}</h3>
          </div>
      </div>

        <div className="col-25">
        <h4>Coming soon!</h4>
        <ul>
        <li>Poker!</li>
        <li>Black jack!</li>
        <li>Craps! </li>
        <li>Sleeping with someone from Botwood!</li>
        </ul>
        </div>
      </div>
      </div>
    )
  }
}

ReactDOM.render(<Start />, document.getElementById('root'));
