import * as THREE from 'three';

const fishMat = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 });
const fishTailMat = new THREE.MeshLambertMaterial({ color: 0xff4500 });
const bellyMat = new THREE.MeshLambertMaterial({ color: 0xe6e6e6 });
const finMat = new THREE.MeshLambertMaterial({ color: 0xff7a1a });
const eyeMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

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
        [0.0, 0.0, 0.0, 1.8, 0.9, 0.7, fishMat],          // main body
        [-0.9, 0.05, 0.0, 0.5, 0.95, 0.75, fishMat],      // head/bulge
        [-0.55, -0.2, 0.0, 0.8, 0.22, 0.55, bellyMat],    // belly strip
        [0.95, 0.0, 0.0, 0.1, 0.8, 0.8, fishTailMat],     // tail base (keel)
        [1.05, 0.0, 0.0, 0.5, 0.7, 0.12, fishTailMat],    // tail fork vertical
        [1.05, 0.0, 0.0, 0.5, 0.12, 0.7, fishTailMat],    // tail fork horizontal
        [-0.8, 0.3,  0.18, 0.1, 0.1, 0.1, eyeMat],        // eye L
        [-0.8, 0.3, -0.18, 0.1, 0.1, 0.1, eyeMat],        // eye R
        [-0.1, 0.5,  0.0,  0.9, 0.22, 0.35, finMat],      // dorsal fin (top, mid)
        [ 0.5,-0.45, 0.0,  0.7, 0.2,  0.3, finMat],       // anal fin (bottom, rear)
    ];
    for (const [x,y,z,w,h,d,mat] of vox) group.add(createVoxel(x,y,z,w,h,d,mat));
    // extra details
    group.add(createVoxel(-1.1, 0.0, 0.0, 0.12, 0.2, 0.2, eyeMat)); // mouth tip
    group.add(createVoxel(-0.7, 0.05, 0.0, 0.12, 0.5, 0.9, bellyMat)); // gill cover
    group.add(createVoxel(-0.55, -0.35,  0.22, 0.35, 0.14, 0.18, finMat)); // pelvic fin L (front bottom)
    group.add(createVoxel(-0.55, -0.35, -0.22, 0.35, 0.14, 0.18, finMat)); // pelvic fin R
    group.add(createVoxel(-0.7,  0.0,   0.5,  0.4, 0.16, 0.2,  finMat));   // pectoral fin L (side near head)
    group.add(createVoxel(-0.7,  0.0,  -0.5,  0.4, 0.16, 0.2,  finMat));   // pectoral fin R
    // orient fish to face downstream (+Z)
    group.rotation.y = Math.PI / 2;
    const riverWidth = 7;
    const xPos = (Math.random() - 0.5) * riverWidth;
    group.position.set(xPos, 2.1, -12);
    const speedMultiplier = 1 + (score / 500);
    const swimSpeed = (0.05 + Math.random() * 0.05) * speedMultiplier;
    group.userData = {
        velocity: new THREE.Vector3(0, 0, swimSpeed),
        initialX: xPos,
        swimFrequency: Math.random() * 5 + 2,
        swimAmplitude: Math.random() * 0.5 + 0.2,
        swimTimer: Math.random() * Math.PI * 2,
        baseRotY: group.rotation.y
    };
    scene.add(group);
    return group;
}

export function updateFish(fish) {
    if (!fish) return;
    fish.position.add(fish.userData.velocity);
    const ud = fish.userData;
    ud.swimTimer += 0.1;
    fish.position.x = ud.initialX + Math.sin(ud.swimTimer * ud.swimFrequency) * ud.swimAmplitude;
    fish.rotation.y = ud.baseRotY + Math.sin(ud.swimTimer * ud.swimFrequency) * 0.12;
}

export function isFishPastLog(fish) {
    return fish && fish.position.z > 3.5;
}