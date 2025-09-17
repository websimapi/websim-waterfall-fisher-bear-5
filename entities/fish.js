import * as THREE from 'three';

const fishMat = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 });
const fishTailMat = new THREE.MeshLambertMaterial({ color: 0xff4500 });
const bellyMat = new THREE.MeshLambertMaterial({ color: 0xe6e6e6 });
const finMat = new THREE.MeshLambertMaterial({ color: 0xff7a1a });
const eyeMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
const scleraMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
const pupilMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

function createVoxel(x, y, z, w, h, d, mat) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
}

export function createFish(scene, score = 0) {
    const group = new THREE.Group();
    group.name = 'fish';
    const vox = [
        [0.0, 0.0, 0.0, 1.8, 0.9, 0.7, fishMat],
        [-0.9, 0.05, 0.0, 0.5, 0.95, 0.75, fishMat],
        [-0.55, -0.2, 0.0, 0.8, 0.22, 0.55, bellyMat],
    ];
    for (const [x,y,z,w,h,d,mat] of vox) group.add(createVoxel(x,y,z,w,h,d,mat));
    
    // tail assembly
    const tailBase = createVoxel(0.95, 0.0, 0.0, 0.1, 0.8, 0.8, fishTailMat);
    const tailV = createVoxel(1.05, 0.0, 0.0, 0.5, 0.7, 0.12, fishTailMat);
    const tailH = createVoxel(1.05, 0.0, 0.0, 0.5, 0.12, 0.7, fishTailMat);
    group.add(tailBase, tailV, tailH);
    
    // fins (referenced for animation)
    const dorsal = createVoxel(-0.1, 0.5, 0.0, 0.9, 0.22, 0.35, finMat);
    const anal = createVoxel( 0.5,-0.45,0.0, 0.7, 0.2,  0.3, finMat);
    group.add(dorsal, anal);
    
    // extra details
    group.add(createVoxel(-1.1, 0.0, 0.0, 0.12, 0.2, 0.2, eyeMat)); // mouth tip
    group.add(createVoxel(-0.7, 0.05, 0.0, 0.12, 0.5, 0.9, bellyMat)); // gill cover
    group.add(createVoxel(-0.55, -0.35,  0.22, 0.35, 0.14, 0.18, finMat)); // pelvic fin L (front bottom)
    group.add(createVoxel(-0.55, -0.35, -0.22, 0.35, 0.14, 0.18, finMat)); // pelvic fin R
    const pectoralL = createVoxel(-0.7, 0.0,  0.5, 0.4, 0.16, 0.2, finMat);
    const pectoralR = createVoxel(-0.7, 0.0, -0.5, 0.4, 0.16, 0.2, finMat);
    group.add(pectoralL, pectoralR);
    
    // detailed eyes (sclera + pupil + highlight + lid)
    const eyeOffset = { x: -0.8, y: 0.28, z: 0.18 };
    const scleraL = createVoxel(eyeOffset.x, eyeOffset.y, +eyeOffset.z, 0.16, 0.16, 0.16, scleraMat);
    const scleraR = createVoxel(eyeOffset.x, eyeOffset.y, -eyeOffset.z, 0.16, 0.16, 0.16, scleraMat);
    const pupilL  = createVoxel(eyeOffset.x-0.03, eyeOffset.y, +eyeOffset.z, 0.06, 0.06, 0.06, pupilMat);
    const pupilR  = createVoxel(eyeOffset.x-0.03, eyeOffset.y, -eyeOffset.z, 0.06, 0.06, 0.06, pupilMat);
    const highlightL = createVoxel(eyeOffset.x-0.05, eyeOffset.y+0.04, +eyeOffset.z+0.04, 0.03, 0.03, 0.03, scleraMat);
    const highlightR = createVoxel(eyeOffset.x-0.05, eyeOffset.y+0.04, -eyeOffset.z-0.04, 0.03, 0.03, 0.03, scleraMat);
    const eyelidTopL = createVoxel(eyeOffset.x, eyeOffset.y+0.11, +eyeOffset.z, 0.18, 0.05, 0.18, fishMat);
    const eyelidTopR = createVoxel(eyeOffset.x, eyeOffset.y+0.11, -eyeOffset.z, 0.18, 0.05, 0.18, fishMat);
    group.add(scleraL, scleraR, pupilL, pupilR, highlightL, highlightR, eyelidTopL, eyelidTopR);
    
    // orient fish to face downstream (+Z)
    group.rotation.y = Math.PI / 2;
    const riverWidth = 7;
    const xPos = (Math.random() - 0.5) * riverWidth;
    const baseY = 2.1;
    group.position.set(xPos, baseY, -12);
    const speedMultiplier = 1 + (score / 500);
    const swimSpeed = (0.05 + Math.random() * 0.05) * speedMultiplier;
    group.userData = {
        velocity: new THREE.Vector3(0, 0, swimSpeed),
        initialX: xPos, baseY,
        swimFrequency: Math.random() * 5 + 2,
        swimAmplitude: Math.random() * 0.5 + 0.2,
        swimTimer: Math.random() * Math.PI * 2,
        baseRotY: group.rotation.y,
        prevX: xPos,
        tailV, tailH, dorsal, anal, pectoralL, pectoralR
    };
    scene.add(group);
    return group;
}

export function updateFish(fish) {
    if (!fish) return;
    const ud = fish.userData;
    // forward motion
    fish.position.add(ud.velocity);
    // lateral weave
    ud.swimTimer += 0.1;
    const weave = Math.sin(ud.swimTimer * ud.swimFrequency) * ud.swimAmplitude;
    fish.position.x = ud.initialX + weave;
    // vertical bob for fluidity
    const bob = Math.sin(ud.swimTimer * 0.8 + 1.3) * 0.08 + Math.sin(ud.swimTimer * 1.7) * 0.05;
    fish.position.y = ud.baseY + bob;
    // orientation: slight yaw + bank based on turn rate
    const dx = fish.position.x - ud.prevX;
    ud.prevX = fish.position.x;
    fish.rotation.y = ud.baseRotY + Math.sin(ud.swimTimer * ud.swimFrequency) * 0.12;
    fish.rotation.z = THREE.MathUtils.clamp(-dx * 0.6, -0.3, 0.3);
    // tail wag and fin flaps
    const tailSwing = Math.sin(ud.swimTimer * 2.2) * 0.5;
    if (ud.tailV) ud.tailV.rotation.y = tailSwing;
    if (ud.tailH) ud.tailH.rotation.y = tailSwing;
    const finFlap = Math.sin(ud.swimTimer * 3.0) * 0.25;
    if (ud.pectoralL) ud.pectoralL.rotation.z = 0.2 + finFlap;
    if (ud.pectoralR) ud.pectoralR.rotation.z = -0.2 - finFlap;
}

export function isFishPastLog(fish) {
    return fish && fish.position.z > 3.5;
}