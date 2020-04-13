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
function Animate(timestamp) { //TODO animate a time-based rotation
    // step 1: calculate time (time since start) 
    // step 2: transform models based on time
    // step 3: draw scene
    // step 4: request next animation frame (recursively calling same function)

    ctx.clearRect(0, 0, view.width, view.height);

    var time = timestamp - start_time;

    // ... step 2
    var tmat_1 = new Matrix(4, 4); 
    var rmat = new Matrix(4, 4); 
    var tmat_2 = new Matrix(4, 4); 
    var mat = new Matrix(4, 4); 
    var rotateFunc; 
    //check each model for animation
    for(var i = 0; i < scene.models.length; i++) {
        //if it is animated... 
        if(scene.models[i].animation) { //TODO what type of empty var is this? 
            //create a compound transform matrix for the model's animation (TODO store this somewhere?)
            /* TODO
            create new mat4x4 and fill it with a rotation
            rotation = 360 / time change % of rotations/second
            rotation = 360 / time mod rotation rate? 
            also create translate to origin and back to original position
            then combine in the correct order
            
            rps = rounds per second
            time is in milliseconds
            (time * 1000) / rps = 1/rounds?
            rps / (time * 1000) = rounds? 
            don't forget the mod for better math
            */
            
            
            Mat4x4Translate(tmat_1, scene.models[i].center[0], scene.models[i].center[1], scene.models[i].center[2]); 
            Mat4x4Translate(tmat_2, -scene.models[i].center[0], -scene.models[i].center[1], -scene.models[i].center[2]); 
            
                 if(scene.models[i].animation.axis === "x") rotateFunc = Mat4x4RotateX; 
            else if(scene.models[i].animation.axis === "y") rotateFunc = Mat4x4RotateY; 
            else                                            rotateFunc = Mat4x4RotateZ; 
            
            rotateFunc(rmat, ((time * 1000) % scene.models[i].animation.rps) / (2*Math.PI)); 
            
            mat = Matrix.multiply([tmat_1, rmat, tmat_2]); 
            
            //apply the transformation to each vertex
            for(var j = 0; j < scene.models[i].vertices.length; j++) {
                scene.models[i].vertices[j] = Matrix.multiply([mat, scene.models[i].vertices[j]]); 
            }
        }
    }
    
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
        scene.models[k].vertices.forEach((vertex) => vertices.push(Matrix.multiply([mat4x4, vertex]))); //back to general
        //clip each model, depending on type of view
        for (var i = 0; i < scene.models[k].edges.length; i++) {
            for(var j = 0; j < scene.models[k].edges[i].length-1; j++) {
                if(scene.view.type === 'perspective') {
                    line = perspectiveClip(vertices[scene.models[k].edges[i][j]], vertices[scene.models[k].edges[i][j+1]]);
                } else {
                    line = {pt0: vertices[scene.models[k].edges[i][j]], pt1: vertices[scene.models[k].edges[i][j+1]]};
                    //line = parallelClip(vertices[scene.models[k].edges[i][j]], vertices[scene.models[k].edges[i][j+1]]);
                    //console.log(line);
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
            } else if (scene.models[i].type === 'cube') {
                var center = scene.models[i].center;
                var width = scene.models[i].width;
                var height = scene.models[i].height;
                var depth = scene.models[i].depth;
                //get the vertices for the cube
                scene.models[i].vertices = getCubeVertices(scene.models[i]);
                scene.models[i].edges = getCubeEdges(scene.models[i]);
                
            } else if (scene.models[i].type === 'cone') {
                scene.models[i].vertices =[];
                scene.models[i].edges =[];
                var center = scene.models[i].center;
                var radius = scene.models[i].radius;
                var height = scene.models[i].height;
                var theta = 360 / scene.models[i].sides;
                var curAngle = theta;

                //find tip
                scene.models[i].vertices.push(Vector4(center[0], center[1] + height/2, center[2], 1));
                //find first point on circle
                scene.models[i].vertices.push(Vector4(center[0] + radius, center[1] - height/2, center[2], 1));
                //find edge from tip to circle point
                scene.models[i].edges.push([0, 1]);
                
                //find each new circle point and connect it to both the circle and the tip
                for (var pt = 0; pt < scene.models[i].sides; pt++) {
                    var x = center[0] + radius * Math.cos(curAngle * Math.PI / 180);
                    var z = center[2] + radius * Math.sin(curAngle * Math.PI / 180);
                    scene.models[i].vertices.push(Vector4(x, center[1] - height/2, z, 1)); //new point
                    scene.models[i].edges.push([pt+1, 0]); //new point to the tip
                    scene.models[i].edges.push([pt, pt+1]); //old point to new point
                    curAngle += theta;
                }
                scene.models[i].edges.push([scene.models[i].vertices.length-1,scene.models[i].vertices.length-2]);

            } else if (scene.models[i].type === 'cylinder') {
                scene.models[i].vertices = []; 
                scene.models[i].edges = []; 
                var center = scene.models[i].center; 
                var radius = scene.models[i].radius; 
                var height = scene.models[i].height; 
                var theta = 360 / scene.models[i].sides; 
                var curAngle = theta; 
                
                //find first points on circles
                scene.models[i].vertices.push(Vector4(center[0] + radius, center[1] - height/2, center[2], 1)); 
                scene.models[i].vertices.push(Vector4(center[0] + radius, center[1] + height/2, center[2], 1)); 
                
                //find each new vertical pair of circle points and connect them to their circles and the matching points
                for(var pt = 0; pt < scene.models[i].sides * 2; pt += 2) {
                    var x = center[0] + radius * Math.cos(curAngle * Math.PI / 180); 
                    var z = center[2] + radius * Math.sin(curAngle * Math.PI / 180); 
                    scene.models[i].vertices.push(Vector4(x, center[1] - height/2, z, 1)); 
                    scene.models[i].vertices.push(Vector4(x, center[1] + height/2, z, 1)); 
                    scene.models[i].edges.push([pt  , pt+2]); //connect lower circle
                    scene.models[i].edges.push([pt+1, pt+3]); //connect upper circle
                    scene.models[i].edges.push([pt  , pt+1]); //connect circles vertically
                    curAngle += theta; 
                }
                //connect the ends to the beginnings (and add final vertical edge)
                scene.models[i].edges.push([scene.models[i].vertices.length-4, scene.models[i].vertices.length-2]); //connect lower circle
                scene.models[i].edges.push([scene.models[i].vertices.length-3, scene.models[i].vertices.length-1]); //connect upper circle
                scene.models[i].edges.push([scene.models[i].vertices.length-4, scene.models[i].vertices.length-3]); //connect circles vertically
                
            } else if (scene.models[i].type === 'sphere') {
                scene.models[i].vertices = []; 
                scene.models[i].edges = []; 
                var center = scene.models[i].center; 
                var radius = scene.models[i].radius; 
                var height = scene.models[i].height; 
                var sideTheta = (2*Math.PI) / scene.models[i].sides; 
                var curSideAngle = 0; 
                var stackTheta = (2*Math.PI) / (2*scene.models[i].stacks); 
                var curStackAngle = 0; 
                var curX, curY, curZ; 
                var pt = 0; 
                
                for(var side = 0; side < scene.models[i].sides; side++) {
                    for(var stack = 0; stack < scene.models[i].stacks; stack++) {
                        curX = radius * Math.cos(curSideAngle) * Math.sin(curStackAngle); 
                        curY = radius * Math.sin(curSideAngle) * Math.sin(curStackAngle); 
                        curZ = radius * Math.cos(curStackAngle); 
                        
                        scene.models[i].vertices.push(Vector4(curX, curY, curZ, 1)); 
                        scene.models[i].edges.push(pt + 1, pt); //connect vertically to next point
                        scene.models[i].edges.push(pt + scene.models[i].stacks - 1, pt); //connect horizontally to next col
                        
                        pt++; 
                        curStackAngle += stackTheta; 
                    }
                    curSideAngle += sideTheta; 
                }
                scene.models[i].edges.push([scene.models[i].vertices.length-2, scene.models[i].vertices.length-1]); 
                scene.models[i].edges.push([scene.models[i].vertices.length-scene.models[i].stacks, scene.models[i].vertices.length-1]); 
                
            } else {
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
    switch (event.keyCode) {
        case 37: // LEFT Arrow
            console.log("left"); 
            var rMat = new Matrix(4, 4);
            Mat4x4RotateY(rMat, -0.05);
            var srp = Vector4(scene.view.srp.x, scene.view.srp.y, scene.view.srp.z, 1);
            var prp = Vector4(scene.view.prp.x, scene.view.prp.y, scene.view.prp.z, 1);
            srp = Matrix.multiply([rMat, srp]);
            prp = Matrix.multiply([rMat, prp]);
            scene.view.srp.x = srp.x;
            scene.view.srp.y = srp.y;
            scene.view.srp.z = srp.z;
            scene.view.prp.x = prp.x;
            scene.view.prp.y = prp.y;
            scene.view.prp.z = prp.z;
            break;
        case 38: // UP Arrow
            console.log("up");
            scene.view.prp.y += 1; 
            scene.view.srp.y += 1; 
            break;
        case 39: // RIGHT Arrow
            var rMat = new Matrix(4, 4);
            Mat4x4RotateY(rMat, 0.05);
            var srp = Vector4(scene.view.srp.x, scene.view.srp.y, scene.view.srp.z, 1);
            var prp = Vector4(scene.view.prp.x, scene.view.prp.y, scene.view.prp.z, 1);
            srp = Matrix.multiply([rMat, srp]);
            prp = Matrix.multiply([rMat, prp]);
            scene.view.srp.x = srp.x;
            scene.view.srp.y = srp.y;
            scene.view.srp.z = srp.z;
            scene.view.prp.x = prp.x;
            scene.view.prp.y = prp.y;
            scene.view.prp.z = prp.z;
            console.log("right");
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

//returns an array of Vector4 vertices, given a cube model
//cube: {type: 'cube', center: [x y z], width w, height h, depth d}
function getCubeVertices(cube) {
    console.log(cube); 
    return [
        Vector4(cube.center[0] - cube.width / 2,  cube.center[1] - cube.height / 2, cube.center[2] + cube.depth / 2, 1), 
        Vector4(cube.center[0] + cube.width / 2,  cube.center[1] - cube.height / 2, cube.center[2] + cube.depth / 2, 1), 
        Vector4(cube.center[0] + cube.width / 2,  cube.center[1] - cube.height / 2, cube.center[2] - cube.depth / 2, 1), 
        Vector4(cube.center[0] - cube.width / 2,  cube.center[1] - cube.height / 2, cube.center[2] - cube.depth / 2, 1), 
        Vector4(cube.center[0] - cube.width / 2,  cube.center[1] + cube.height / 2, cube.center[2] + cube.depth / 2, 1), 
        Vector4(cube.center[0] + cube.width / 2,  cube.center[1] + cube.height / 2, cube.center[2] + cube.depth / 2, 1), 
        Vector4(cube.center[0] + cube.width / 2,  cube.center[1] + cube.height / 2, cube.center[2] - cube.depth / 2, 1), 
        Vector4(cube.center[0] - cube.width / 2,  cube.center[1] + cube.height / 2, cube.center[2] - cube.depth / 2, 1) 
    ]; 
}

//returns a 2d array of point number pairs, given a cube model
//cube: {type: 'cube', center: [x y z], width w, height h, depth d}
function getCubeEdges(cube) {
    return [
        [0, 1, 2, 3, 0],
        [4, 5, 6, 7, 4],
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7]
    ]
}
