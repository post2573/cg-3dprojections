// set values of mat4x4 to the parallel projection / view matrix
function Mat4x4Parallel(mat4x4, prp, srp, vup, clip) {
	//NPAR
    // 1. translate PRP to origin
    var translateMat = new Matrix(4, 4);
    Mat4x4Translate(translateMat, -prp.x, -prp.y, -prp.z);
    // 2. rotate VRC such that (u,v,n) align with (x,y,z)
    var rotateMat = new Matrix(4, 4);
    var n = prp.subtract(srp);
    n.normalize();

    var u = vup.cross(n);
    u.normalize();

    var v = n.cross(u);
    rotateMat.values = [[u.x, u.y, u.z, 0], [v.x, v.y, v.z, 0], [n.x, n.y, n.z, 0], [0, 0, 0, 1]];
    // 3. shear such that CW is on the z-axis
    var cw = Vector3((clip[0]+clip[1])/2, (clip[2]+clip[3])/2, -clip[4]); //need to use clip variable. Need to create a vector?
    var dop = cw.subtract(Vector3(0,0,0));
    var shPar = new Matrix(4,4);
    Mat4x4ShearXY(shPar, (-dop.x/dop.z), (-dop.y/dop.z));
    // 4. translate near clipping plane to origin
    var tpar = new Matrix(4,4);
    tpar.values = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, clip[4]], [0, 0, 0, 1]];
    // 5. scale such that view volume bounds are ([-1,1], [-1,1], [-1,0])
    var sParX = 2 / (clip[1] - clip[0]);
    var sParY = 2 / (clip[3] - clip[2]);
    var sParZ = 1 / (clip[5] - clip[4]);
    var sPar = new Matrix(4,4);
    Mat4x4Scale(sPar, sParX, sParY, sParZ);
    // ...
    var transform = Matrix.multiply([sPar, tpar, shPar, rotateMat, translateMat]);
    mat4x4.values = transform.values;
}

// set values of mat4x4 to the parallel projection / view matrix
function Mat4x4Projection(mat4x4, prp, srp, vup, clip) {
    //TODO how do I know what the inputs are
    //gonna assume everything is a matrix (or vector, which is a child of matrix)
    
    // 1. translate PRP to origin
    var translatePRP = Mat4x4Translate(new Matrix(4, 4), prp.x, prp.y, prp.z); 
    prp = Matrix.multiply(translatePRP, prp); 
    
    // 2. rotate VRC such that (u,v,n) align with (x,y,z)
    //what is vrc and how does it translate to my arguments? 
    //vrc = secondary coordinate system, origin at prp and aimed from vup and srp->prp
    //so origin was changed in step 1, now change vup and check srp
    
    // 3. shear such that CW is on the z-axis
    // 4. scale such that view volume bounds are ([z,-z], [z,-z], [-1,zmin])

    // ...
    // var transform = Matrix.multiply([...]);
    // mat4x4.values = transform.values;
    
    //NOTE this is my job
}

// set values of mat4x4 to project a parallel image on the z=0 plane
function Mat4x4MPar(mat4x4) {
    mat4x4.values = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 1]];
}

// set values of mat4x4 to project a perspective image on the z=-1 plane
function Mat4x4MPer(mat4x4) {
    // mat4x4.values = ...;
    
    //NOTE my job
}



///////////////////////////////////////////////////////////////////////////////////
// 4x4 Transform Matrices                                                         //
///////////////////////////////////////////////////////////////////////////////////

// set values of mat4x4 to the identity matrix
function Mat4x4Identity(mat4x4) {
    mat4x4.values = [[1, 0, 0, 0],
                     [0, 1, 0, 0],
                     [0, 0, 1, 0],
                     [0, 0, 0, 1]];
}

// set values of mat4x4 to the translate matrix
function Mat4x4Translate(mat4x4, tx, ty, tz) {
    mat4x4.values = [[1, 0, 0, tx],
                     [0, 1, 0, ty],
                     [0, 0, 1, tz],
                     [0, 0, 0, 1]];
}

// set values of mat4x4 to the scale matrix
function Mat4x4Scale(mat4x4, sx, sy, sz) {
    mat4x4.values = [[sx,  0,  0, 0],
                     [ 0, sy,  0, 0],
                     [ 0,  0, sz, 0],
                     [ 0,  0,  0, 1]];
}

// set values of mat4x4 to the rotate about x-axis matrix
function Mat4x4RotateX(mat4x4, theta) {
    mat4x4.values = [[1,               0,                0, 0],
                     [0, Math.cos(theta), -Math.sin(theta), 0],
                     [0, Math.sin(theta),  Math.cos(theta), 0],
                     [0,               0,                0, 1]];
}

// set values of mat4x4 to the rotate about y-axis matrix
function Mat4x4RotateY(mat4x4, theta) {
    mat4x4.values = [[ Math.cos(theta), 0, Math.sin(theta), 0],
                     [               0, 1,               0, 0],
                     [-Math.sin(theta), 0, Math.cos(theta), 0],
                     [0, 0, 0, 1]];
}

// set values of mat4x4 to the rotate about z-axis matrix
function Mat4x4RotateZ(mat4x4, theta) {
    mat4x4.values = [[Math.cos(theta), -Math.sin(theta), 0, 0],
                     [Math.sin(theta),  Math.cos(theta), 0, 0],
                     [              0,                0, 1, 0],
                     [              0,                0, 0, 1]];
}

// set values of mat4x4 to the shear parallel to the xy-plane matrix
function Mat4x4ShearXY(mat4x4, shx, shy) {
    mat4x4.values = [[1, 0, shx, 0],
                     [0, 1, shy, 0],
                     [0, 0,   1, 0],
                     [0, 0,   0, 1]];
}

// create a new 3-component vector with values x,y,z
function Vector3(x, y, z) {
    let vec3 = new Vector(3);
    vec3.values = [x, y, z];
    return vec3;
}

// create a new 4-component vector with values x,y,z,w
function Vector4(x, y, z, w) {
    let vec4 = new Vector(4);
    vec4.values = [x, y, z, w];
    return vec4;
}
