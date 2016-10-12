var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var piblaster = require('pi-blaster.js');

const fs = require("fs");

// Add some code that writes the process id to a file
// then use that file in an kill command on stop like
// kill -9 $(cat hyperserver.pid)


const pid = process.pid;
const pidFile = "/run/hyperserver.pid";

//fs.writeFile(pidFile, pid, function(err){
//if(err){
	//console.log(err)
//}
//});


function allOn(){
//front left
piblaster.setPwm(18, 0.92 );
piblaster.setPwm(22, 0 );


//front right
piblaster.setPwm(24, 0 );
piblaster.setPwm(27, 1 );

//back left
piblaster.setPwm(25, 0.92 );
piblaster.setPwm(17, 0 );

//back right
piblaster.setPwm(23, 0 );
piblaster.setPwm(4, 1 );
}
function turnRight(){
//front left
piblaster.setPwm(18, 0.92 );
piblaster.setPwm(22, 0 );


//front right
piblaster.setPwm(24, 0 );
piblaster.setPwm(27, 0 );

//back left
piblaster.setPwm(25, 0.92 );
piblaster.setPwm(17, 0 );

//back right
piblaster.setPwm(23, 0 );
piblaster.setPwm(4, 0 );
}

function turnLeft(){
//front left
piblaster.setPwm(18, 0 );
piblaster.setPwm(22, 0 );


//front right
piblaster.setPwm(24, 0 );
piblaster.setPwm(27, 1 );

//back left
piblaster.setPwm(25, 0 );
piblaster.setPwm(17, 0 );

//back right
piblaster.setPwm(23, 0 );
piblaster.setPwm(4, 1 );
}

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
               allOn();
               setTimeout(function(){
                   killEngines();
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
               allOn();
               setTimeout(function(){
                   console.log('pi off')
                   killEngines();
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
    console.log(snap.val())
    if(snap.val().x === 'kill engines'){
        killEngines();
    }
    var throttle = snap.val().z;
    if(throttle > 0 && snap.val().x < 0 ){
	allOn();
	console.log('full steam ahead');
	}
    //--y == left ++ y == right

    else if(snap.val().y < -3){
        console.log('turning left');
        turnLeft();
    }

    else if(snap.val().y > 3){
        console.log('turning right');
        turnRight();
    }

    else if(throttle > 0 && throttle !== null){
        var deci = throttle/10;
        if(deci > 0.7){
            deci = 1;
        }
	    console.log(deci);

        piblaster.setPwm(18, deci );
        piblaster.setPwm(22, 0 );

        piblaster.setPwm(24, 0 );
        piblaster.setPwm(27, deci );

        piblaster.setPwm(25, deci );
        piblaster.setPwm(17, 0 );

        piblaster.setPwm(23, 0 );
        piblaster.setPwm(4, deci ); 
  }
})

process.on("SIGINT", function(){
    killEngines();
	setTimeout(function(){
		process.exit();	
	}, 500)
});

function inProgress(ref, key){
    return ref.child(key).update({isDone: 'inProgress'})
}

function killEngines(){
    piblaster.setPwm(18, 0 );
	piblaster.setPwm(22, 0 );



	piblaster.setPwm(24, 0 );
	piblaster.setPwm(17, 0 );
	piblaster.setPwm(27, 0 );


	piblaster.setPwm(25, 0 );
	piblaster.setPwm(21, 0 );

	piblaster.setPwm(23, 0 );
	piblaster.setPwm(4, 0 );
    console.log('engines killed')
}
app.get('/', function(req, res, next){
    res.send('recieved socket');
});

http.listen(3030, function(){
    console.log('listening on *:3030');
});
