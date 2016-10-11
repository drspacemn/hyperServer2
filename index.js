var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var piblaster = require('pi-blaster.js');

//front left
// piblaster.setPwm(18, 1 );
// piblaster.setPwm(22, 0 );


//front right
// piblaster.setPwm(24, 0 );
// piblaster.setPwm(27, 1 );

//back left
// piblaster.setPwm(25, 0 );
// piblaster.setPwm(21, 0 );

//back right
// piblaster.setPwm(23, 0 );
// piblaster.setPwm(4, 0 );


var firebase = require("firebase");
firebase.initializeApp({
  serviceAccount: "./HyperBot-c52ccadf3e05.json",
  databaseURL: "https://hyperbot-d6494.firebaseio.com"
});

var controlRef = firebase.database().ref().child('control');
controlRef.on('value', function(snap){
  console.log(snap.val());
})

var goProRef = firebase.database().ref().child('goProHyper');
goProRef.on('value', function(snap){
    var snap = snap.val();
    for(var key in snap){
        if(!snap[key].isDone){
            //time, dist, interval
       console.log('recieved goProTL')
        inProgress(goProRef, key);
           var interval = snap[key].interval * 1000;
           var time = (snap[key].time * 60) * 1000;
           var timeout;
           if(interval > 3000){
               timeout = 1000;
           }else{
               timeout = 500;
           }
           var movements = time/interval;

           var move = function(){
               console.log('pi on')
               piblaster.setPwm(18, 1 );    
               piblaster.setPwm(22, 0 );
               setTimeout(function(){
                   console.log('pi off')
                   piblaster.setPwm(18, 0 );    
                   piblaster.setPwm(22, 0 );
               }, timeout)
               movements--;
               console.log(movements);
               if(movements <= 0){
                clearInterval(this);
                goProRef.child(key).update({isDone: true})
               }                
           }
            
            
           setInterval(move, interval);
         
        }        
    }    
})

var iPhoneRef = firebase.database().ref().child('iPhoneHyper');
iPhoneRef.on('value', function(snap){
    var snap = snap.val();    
   
    for(var key in snap){
        if(!snap[key].isDone){
            //iPhoneTime iPhoneInt iPhoneCurve
            console.log('recieved iPhoneTL')
        setTimeout(function(){
        inProgress(iPhoneRef, key);
           var iinterval = snap[key].iPhoneInt * 1000;
           var itime = (snap[key].iPhoneTime * 60) * 1000;
           var imovements = itime/iinterval;

           var imove = function(){
            console.log('pi on')
               piblaster.setPwm(18, 1 );    
               piblaster.setPwm(22, 0 );
               setTimeout(function(){
                   console.log('pi off')
                   piblaster.setPwm(18, 0 );    
                   piblaster.setPwm(22, 0 );
               }, 1000)
               imovements--;  
               if(imovements < 0){
               clearInterval(this);
               iPhoneRef.child(key).update({isDone: true})
            }
           }
           setInterval(imove, iinterval);
            }, 10000);        
        }        
    }  
})
//ref.child('control').push({x: result.x, y: result.y, z: result.z})
var ControlRef = firebase.database().ref().child('control');
ControlRef.on('child_added', function(snap){
    var throttle = snap.val().z;
    if(throttle > 0){
        var deci = throttle/10;
        piblaster.setPwm(18, deci );    
        piblaster.setPwm(22, 0 );
    }else {
        piblaster.setPwm(18, 0 );    
        piblaster.setPwm(22, 0 );
    }
})

function inProgress(ref, key){
    return ref.child(key).update({isDone: 'inProgress'})
}

app.get('/', function(req, res, next){
    res.send('recieved socket');
});

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
    })
    socket.on('chat message', function(msg){
        console.log(msg)
        io.emit('chat message', msg);
    })
})

process.on("SIGINT", function(){
	piblaster.setPwm(18, 0 );
	piblaster.setPwm(22, 0 );



	piblaster.setPwm(24, 0 );
	piblaster.setPwm(17, 0 );
	piblaster.setPwm(27, 0 );


	piblaster.setPwm(25, 0 );
	piblaster.setPwm(21, 0 );

	piblaster.setPwm(23, 0 );
	piblaster.setPwm(4, 0 );
	
	setTimeout(function(){
		process.exit();	
	}, 500)
});

http.listen(3030, function(){
    console.log('listening on *:3030');
});
