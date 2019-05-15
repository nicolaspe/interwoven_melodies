const vid_wid = 640;
const vid_hei = 360;
const e_thres = 0.35;
// variables
let ws, id;
let   scale   = [];
const sc_mod  = [0, 12, 12]; 
let pose_data = {};
let synths;

window.addEventListener('load', preload);

// preload : get video feed + initialize PoseNet
function preload(){
    // video feed element
    let vid = document.getElementById("vid_feed");
    vid.width  = vid_wid;   // needed for PoseNet
    vid.height = vid_hei;   // needed for PoseNet

    // get video feed
    navigator.mediaDevices.getUserMedia({
        video: {width: vid_wid, height: vid_hei, facingMode: 'user'}
    }).then(function(stream){
        vid.srcObject = stream;
        vid.play();
    }).catch( function(err){
        console.error("!!! Camera error: " + err);
    });

    // initialize PoseNet
    poseNet = ml5.poseNet(vid, function(){ 
        console.log("> PoseNet ON");
        init(); 
    });
}

// overall initialization
function init(){
    // setup websocket
    ws = new WebSocket("wss://" + window.location.host);

    // three init
    let wid = window.innerWidth;
	let hei = window.innerHeight;
	renderer = new THREE.WebGLRenderer({ });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(wid, hei);
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x000000 );
	camera = new THREE.PerspectiveCamera(60, wid/hei, 0.1, 5000);
	camera.position.set( -10, 0, 0 );
    container = document.querySelector('#sketch');
    container.appendChild(renderer.domElement);

    // tone init
    Tone.Transport.bpm = 120;
    Tone.Transport.start();
    synths = [];
    create_synths();
    
    // model
    poseNet.on('pose', analyzePoses);
    pose_data["head"] = [];
    pose_data["armL"] = [];
    pose_data["armR"] = [];
    pose_data["nrgy"] = [];

    // callbacks
    ws.onmessage = onWSMessage;
    window.addEventListener('resize', onWindowResize, true );

    console.log("Interwoven Melodies, READY");

    animate();
}


// ANIMATION
function animate() {
    renderer.setAnimationLoop( render );
}
function render(){
    renderer.render( scene, camera );
}


// POSE 
function analyzePoses(results){
    /* PoseNet parts
        0:      Nose
        1/2:    Left/Right Eye
        3/4:    Left/Right Ear
    */
    // clear extra saved data
    if(results.length > pose_data["head"].length){
        let diff = results.length > pose_data["head"].length;
        for(let i=0; i<diff; i++){
            pose_data["head"].push([]);
            pose_data["armL"].push([]);
            pose_data["armR"].push([]);
            pose_data["nrgy"].push([]);
        }
    }
    // analyze results
    for(let i=0; i<results.length; i++){
        let joints = results[i].pose.keypoints;
        // console.log(joints);
        // face position : nose, eyes and ears
        let pos_x = joints[0].position.x / vid_wid;
        let pos_y = joints[0].position.y / vid_hei;
        let base  = 1;
        for(let j=1; j<3; j++){
            // proceed if high confidence
            if(joints[2*j+0].score < 0.7 || joints[2*j+1].score < 0.7){ continue; }
            pos_x += (joints[2*j+0].position.x / vid_wid);
            pos_y += (joints[2*j+0].position.y / vid_hei);
            pos_x += (joints[2*j+1].position.x / vid_wid);
            pos_y += (joints[2*j+1].position.y / vid_hei);
            base  += 2;
        }
        pos_x = pos_x / base;
        pos_y = pos_y / base;
        // arms
        let arm_Lx = (joints[9].score>0.7)  ? joints[9].position.x  / vid_wid : 0.;
        let arm_Ly = (joints[9].score>0.7)  ? joints[9].position.y  / vid_hei : 0.;
        let arm_Rx = (joints[10].score>0.7) ? joints[10].position.x / vid_wid : 0.;
        let arm_Ry = (joints[10].score>0.7) ? joints[10].position.y / vid_hei : 0.;
        // measure "movement energy"
        let energy = [0, 0, 0];
        // console.log(">\ti: " + i + " - " + pose_data["nrgy"][i]);
        if(!Array.isArray(pose_data["nrgy"][i])){ }
        else if(pose_data["nrgy"][i].length < 3){ }
        else{
            energy[0] = (Math.abs(pos_x  - pose_data["head"][i][0] ) + Math.abs(pos_y  - pose_data["head"][i][1])) *2;
            energy[1] =  Math.abs(arm_Lx - pose_data["armL"][i][0] ) + Math.abs(arm_Ly - pose_data["armL"][i][1]);
            energy[2] =  Math.abs(arm_Rx - pose_data["armR"][i][0] ) + Math.abs(arm_Ry - pose_data["armR"][i][1]);
        }
        // console.log("energy: " + energy);
        // trigger sounds
        let note_id = Math.floor( Math.random()*scale.length );
        for(let n=0; n<3; n++){
            if(energy[n] < e_thres){ continue; }
            let note = scale[note_id] + sc_mod[n] * Math.pow(-1, Math.floor(Math.random() * 100));
            let dur  = energy[n];
            let vol  = Math.min(Math.max(0.4, energy[n]*1.5), 1.0);
            play_note(note, dur, vol, 0);
            send_note(note, dur, vol);
        }
        // save data for next frame
        pose_data["head"][i] = [pos_x, pos_y];
        pose_data["armL"][i] = [arm_Lx, arm_Ly];
        pose_data["armR"][i] = [arm_Rx, arm_Ry];
        pose_data["nrgy"][i] = energy;
    }
}


// SOUND
function play_note(note, dur, vol, synth_id){
    let freq = Tone.Midi(note).toFrequency();
    // console.log(">\tto play: " + note + ", " + dur + ", " +vol);
    synths[synth_id].triggerAttackRelease(freq, "8n");
}
function create_synths(){
    let synth_base = new Tone.PolySynth( 6, Tone.Synth ).toMaster();
    synth_base.set({
        "envelope"  : {
            "attack"  : 0.01 ,
            "decay"   : 0.65 ,
            "sustain" : 0.65 ,
            "release" : 0.70
        }
    })
    synths.push(synth_base);

    let synth_fm = new Tone.PolySynth( 6, Tone.FMSynth ).toMaster();
	synth_fm.set({
		"harmonicity": 6,
		"modulationIndex": 8,
		"envelope": {
			"attack": 0.01,
			"decay": 0.2,
			"sustain": 0.95,
			"release": 0.2
		},
		"modulation": {
			"type": "sawtooth"
		},
		"modulationEnvelope": {
			"envelope": {
				"attack": 0.01,
				"decay": 0.01,
				"sustain": 0.8,
				"release": 0.5
			}
		}
	});
    synths.push(synth_fm);

    let synth_xm = new Tone.PolySynth( 6, Tone.FMSynth ).toMaster();
	synth_xm.set({
		"harmonicity": 3.5,
		"modulationIndex": 5.5,
		"envelope": {
			"attack": 0.01,
			"decay": 0.,
			"sustain": 0.95,
			"release": 0.2
		},
		"modulation": {
			"type": "sawtooth"
		},
		"modulationEnvelope": {
			"envelope": {
				"attack": 0.01,
				"decay": 0.01,
				"sustain": 0.5,
				"release": 0.5
			}
		}
	});
    synths.push(synth_xm);
}


// EVENTS & communication
function onWSMessage(msg){
    let txt_msg = msg.data;
    console.log("# got msg: " + txt_msg);
    
    // check for valid message
    if(txt_msg[0] != '/' || txt_msg.split(':').length < 2){ return; }

    // parse message address
    let addr = txt_msg.split(':')[0];
    let cont = txt_msg.split(':')[1];

    if(addr == "/id"){
        id = cont;
        console.log("id = " + id);
    } else if(addr == "/scale"){
        in_scl = cont.split(',');
        for(let i=0; i<in_scl.length-1; i++){ scale.push(parseInt(in_scl[i])); }
    } else if(addr == "/note"){
        let props = cont.split(',');
        let synth_id = 1 + Math.floor(Math.random()*2);
        play_note(props[0], props[1], props[2], synth_id);
    } else if(addr == "/msg"){
        // console.log(">\tMSG : " + cont);
    }
}
function send_note(note, dur, vol){
    let msg = "/note:";
    msg += id   + ",";
    msg += note + ",";
    msg += dur  + ",";
    msg += vol  + ",";
    ws.send(msg);
}

function onWindowResize(){
    let wid = window.innerWidth;
    let hei = window.innerHeight;
  
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(wid, hei);
    camera.aspect = wid/hei;
    camera.updateProjectionMatrix();
}
