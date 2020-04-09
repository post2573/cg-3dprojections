var view;
var ctx;
var scene;
var start_time;

var LEFT = 32;
var RIGHT = 16;
var BOTTOM = 8;
var TOP = 4;
var NEAR = 2;
var FAR = 1;

// Initialization function - called when web page loads
function Init() {
    var w = 800;
    var h = 600;
    view = document.getElementById('view');
    view.width = w;
    view.height = h;

    ctx = view.getContext('2d');

    // initial scene... feel free to change this
    scene = {
        view: {
           type: 'parallel',
          prp: Vector3(10, 10, 5),
          srp: Vector3(10, 10, -30),
          vup: Vector3(0, 1, 0),
          clip:  [-11, 11, -11, 11, 5, 100]
        },
        models: [
            {
                type: 'generic',
                vertices: [
                    Vector4( 0,  0, -30, 1),
                    Vector4(20,  0, -30, 1),
                    Vector4(20, 12, -30, 1),
                    Vector4(10, 20, -30, 1),
                    Vector4( 0, 12, -30, 1),
                    Vector4( 0,  0, -60, 1),
                    Vector4(20,  0, -60, 1),
                    Vector4(20, 12, -60, 1),
                    Vector4(10, 20, -60, 1),
                    Vector4( 0, 12, -60, 1)
                ],
                edges: [
                    [0, 1, 2, 3, 4, 0],
                    [5, 6, 7, 8, 9, 5],
                    [0, 5],
                    [1, 6],
                    [2, 7],
                    [3, 8],
                    [4, 9]
                ],
                matrix: new Matrix(4, 4)
            }
        ]
    };

    // event handler for pressing arrow keys
    document.addEventListener('keydown', OnKeyDown, false);
    
    // start animation loop
    start_time = performance.now(); // current timestamp in milliseconds
    window.requestAnimationFrame(Animate);
}

// Animation loop - repeatedly calls rendering code
function Animate(timestamp) { //TODO animate
    // step 1: calculate time (time since start) 
    // step 2: transform models based on time
    // step 3: draw scene
    // step 4: request next animation frame (recursively calling same function)


    var time = timestamp - start_time;

    // ... step 2
    
    DrawScene();
    
    window.requestAnimationFrame(Animate);
}

// Main drawing code - use information contained in variable `scene`
function DrawScene() {
    var mat4x4 = new Matrix(4,4);
    var vertices = [];
    var line;
    var V = new Matrix(4, 4);
    var pt0;
    var pt1;
    var mat4x4_m = new Matrix(4,4);
    
    ctx.clearRect(0, 0, view.width, view.height);

    V.values = [[view.width/2, 0, 0, view.width/2], [0, view.height/2, 0, view.height/2], [0, 0, 1, 0], [0, 0, 0, 1]];
    if(scene.view.type === 'perspective') {
        //Nper
        Mat4x4Projection(mat4x4, scene.view.prp, scene.view.srp, scene.view.vup, scene.view.clip);
        Mat4x4MPer(mat4x4_m);
    } else {
        Mat4x4Parallel(mat4x4, scene.view.prp, scene.view.srp, scene.view.vup, scene.view.clip);
        Mat4x4MPar(mat4x4_m);
    }
        //clip
    for (var k = 0; k < scene.models.length; k++) {
        scene.models[k].vertices.forEach((vertex) => vertices.push(Matrix.multiply([mat4x4, vertex])));
        console.log(vertices);
        for (var i = 0; i < scene.models[k].edges.length; i++) {
            for(var j = 0; j < scene.models[k].edges[i].length-1; j++) {
                if(scene.view.type === 'perspective') {
                    line = perspectiveClip(vertices[scene.models[k].edges[i][j]], vertices[scene.models[k].edges[i][j+1]]);
                } else {
                    line = {pt0: vertices[scene.models[k].edges[i][j]], pt1: vertices[scene.models[k].edges[i][j+1]]};
                    //line = parallelClip(vertices[scene.models[k].edges[i][j]], vertices[scene.models[k].edges[i][j+1]]);
                    console.log(line);
                }
                if (line) {
                    //mper and v
                    pt0 = Matrix.multiply([V, mat4x4_m, line.pt0]);
                    pt1 = Matrix.multiply([V, mat4x4_m, line.pt1]);
                    DrawLine(pt0.x/pt0.w, pt0.y/pt0.w, pt1.x/pt1.w, pt1.y/pt1.w);
                }
            }
        }
    }   
}

// Called when user selects a new scene JSON file
function LoadNewScene() {
    var scene_file = document.getElementById('scene_file');

    console.log(scene_file.files[0]);

    var reader = new FileReader();
    reader.onload = (event) => {
        scene = JSON.parse(event.target.result);
        scene.view.prp = Vector3(scene.view.prp[0], scene.view.prp[1], scene.view.prp[2]);
        scene.view.srp = Vector3(scene.view.srp[0], scene.view.srp[1], scene.view.srp[2]);
        scene.view.vup = Vector3(scene.view.vup[0], scene.view.vup[1], scene.view.vup[2]);

        for (let i = 0; i < scene.models.length; i++) {
            if (scene.models[i].type === 'generic') {
                for (let j = 0; j < scene.models[i].vertices.length; j++) {
                    scene.models[i].vertices[j] = Vector4(scene.models[i].vertices[j][0],
                                                          scene.models[i].vertices[j][1],
                                                          scene.models[i].vertices[j][2],
                                                          1);
                }
            }
            else {
                scene.models[i].center = Vector4(scene.models[i].center[0],
                                                 scene.models[i].center[1],
                                                 scene.models[i].center[2],
                                                 1);
            }
            scene.models[i].matrix = new Matrix(4, 4);
        }
    };
    reader.readAsText(scene_file.files[0], "UTF-8");
}

// Called when user presses a key on the keyboard down 
function OnKeyDown(event) {
    //change scene.view.prp and such? 
    //first delete old scene before drawing new one
    switch (event.keyCode) {
        case 37: // LEFT Arrow
            console.log("left");
            scene.view.prp.x -= 1; 
            scene.view.srp.x -= 1; 
            break;
        case 38: // UP Arrow
            console.log("up");
            scene.view.prp.y += 1; 
            scene.view.srp.y += 1; 
            break;
        case 39: // RIGHT Arrow
            console.log("right");
            scene.view.prp.x += 1; 
            scene.view.srp.x += 1; 
            break;
        case 40: // DOWN Arrow
            console.log("down");
            scene.view.prp.y -= 1; 
            scene.view.srp.y -= 1; 
            break;
    }
}

// Draw black 2D line with red endpoints 
function DrawLine(x1, y1, x2, y2) {
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.fillStyle = '#FF0000';
    ctx.fillRect(x1 - 2, y1 - 2, 4, 4);
    ctx.fillRect(x2 - 2, y2 - 2, 4, 4);
}

function parallelClip(pt0, pt1) {
    var done = false;
    var line = null;
    var endpt0 = Vector4(pt0.x, pt0.y, pt0.z, pt0.w);
    var endpt1 = Vector4(pt1.x, pt1.y, pt1.z, pt1.w);
    var pt0_outcode;
    var pt1_outcode;
    var selectedOutcode;
    var t;
    while(!done) {
        //trivial accept and reject
        pt0_outcode = parallelOutcode(endpt0);
        pt1_outcode = parallelOutcode(endpt1);
        if ((pt0_outcode | pt1_outcode) === 0) {
            done = true;
            line = {pt0: endpt0, pt1: endpt1};
        } else if ((pt0_outcode & pt1_outcode) !== 0) {
            done = true;
        } else {
            //select 1 endpoint outside of view
            if (pt0_outcode !== 0) {
                selectedOutcode = pt0_outcode;
            } else {
                selectedOutcode = pt1_outcode;
            }
            //find intersection with corresponding edge
            if (selectedOutcode & LEFT) {
                t = (-1 - endpt0.x) / (endpt1.x - endpt0.x);
            } else if (selectedOutcode & RIGHT) {
                t = (1 - endpt0.x) / (endpt1.x - endpt0.x);
            } else if (selectedOutcode & BOTTOM) {
                t = (-1 - endpt0.y) / (endpt1.y - endpt0.y);
            } else if(selectedOutcode & TOP) {
                t = (1 - endpt0.y) / (endpt1.y - endpt0.y);
            } else if(selectedOutcode & NEAR) {
                t = (0 - endpt0.z) / (endpt1.z - endpt0.z);
            } else {
                t = (-1 - endpt0.z) / (endpt1.z - endpt0.z);
            }
            //replace selected endpoint with new intersection point
            if (selectedOutcode === pt0_outcode) {
                endpt0.x = endpt0.x + t * (endpt1.x - endpt0.x);
                endpt0.y = endpt0.y + t * (endpt1.y - endpt0.y);
                endpt0.z = endpt0.z + t * (endpt1.z - endpt0.z);
            } else {
                endpt1.x = endpt0.x + t * (endpt1.x - endpt0.x);
                endpt1.y = endpt0.y + t * (endpt1.y - endpt0.y);
                endpt1.z = endpt0.z + t * (endpt1.z - endpt0.z);
            }
        }   
    }
    return line;
}

function parallelOutcode(pt) {
    //need to figure out what is being passed in as the view
    var outcode = 0;
    if (pt.x < -1) {
        outcode += LEFT;
    } else if (pt.x > 1){
        outcode += RIGHT;
    }
    
    if (pt.y < -1) {
        outcode += BOTTOM;
    }else if (pt.y > 1){
        outcode += TOP;
    }

    if (pt.z > 0) {
        outcode += NEAR;
    } else if (pt.z < -1) {
        outcode += FAR;
    }
    
    return outcode;
}

function perspectiveClip(pt0, pt1) {
    var done = false;
    var line = null;
    var endpt0 = Vector4(pt0.x, pt0.y, pt0.z, pt0.w);
    var endpt1 = Vector4(pt1.x, pt1.y, pt1.z, pt1.w);
    var pt0_outcode;
    var pt1_outcode;
    var selectedOutcode;
    var t;
    var z_min = -(scene.view.clip[4]/scene.view.clip[5]);
    while(!done) {
        //trivial accept and reject
        pt0_outcode = perspectiveOutcode(endpt0);
        pt1_outcode = perspectiveOutcode(endpt1);
        if ((pt0_outcode | pt1_outcode) === 0) {
            done = true;
            line = {pt0: endpt0, pt1: endpt1};
        } else if ((pt0_outcode & pt1_outcode) !== 0) {
            done = true;
        } else {
            //select 1 endpoint outside of view
            if (pt0_outcode !== 0) {
                selectedOutcode = pt0_outcode;
            } else {
                selectedOutcode = pt1_outcode;
            }
            //find intersection with corresponding edge
            if (selectedOutcode & LEFT) {
                t = (-endpt0.x + endpt0.z) / ((endpt1.x - endpt0.x) - (endpt1.z - endpt0.z));
            } else if (selectedOutcode & RIGHT) {
                t = (endpt0.x + endpt0.z) / (-(endpt1.x - endpt0.x) - (endpt1.z - endpt0.z));
            } else if (selectedOutcode & BOTTOM) {
                t = (-endpt0.y + endpt0.z) / ((endpt1.y - endpt0.y) - (endpt1.z - endpt0.z));
            } else if(selectedOutcode & TOP) {
                t = (endpt0.y + endpt0.z) / (-(endpt1.y - endpt0.y) - (endpt1.z - endpt0.z));
            } else if(selectedOutcode & NEAR) {
                t = (endpt0.z - z_min) / (endpt1.z - endpt0.z);
            } else {
                t = (-endpt0.z - 1) / (endpt1.z - endpt0.z);
            }
            //replace selected endpoint with new intersection point
            if (selectedOutcode === pt0_outcode) {
                endpt0.x = endpt0.x + t * (endpt1.x - endpt0.x);
                endpt0.y = endpt0.y + t * (endpt1.y - endpt0.y);
                endpt0.z = endpt0.z + t * (endpt1.z - endpt0.z);
            } else {
                endpt1.x = endpt0.x + t * (endpt1.x - endpt0.x);
                endpt1.y = endpt0.y + t * (endpt1.y - endpt0.y);
                endpt1.z = endpt0.z + t * (endpt1.z - endpt0.z);
            }
        }   
    }
    return line;
}

function perspectiveOutcode(pt) {
    var z_min = -(scene.view.clip[4]/scene.view.clip[5]);
    var outcode = 0;
    if (pt.x < pt.z) {
        outcode += LEFT;
    } else if (pt.x > -pt.z){
        outcode += RIGHT;
    }
    
    if (pt.y < pt.z) {
        outcode += BOTTOM;
    }else if (pt.y > -pt.z){
        outcode += TOP;
    }

    if (pt.z > z_min) {
        outcode += NEAR;
    } else if (pt.z < -1) {
        outcode += FAR;
    }
    
    return outcode;
}
