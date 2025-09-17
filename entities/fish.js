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
        [0, 0, 0, 1.6, 0.8, 0.6, fishMat],        // main body
        [-0.6, -0.15, 0, 1.0, 0.25, 0.5, bellyMat], // belly strip
        [0.75, 0, -0.55, 0.6, 0.6, 0.2, fishTailMat], // tail cross 1
        [0.75, 0, -0.55, 0.6, 0.2, 0.6, fishTailMat], // tail cross 2
        [-0.7, 0.25, 0.18, 0.1, 0.1, 0.1, eyeMat], // eye L
        [-0.7, 0.25,-0.18, 0.1, 0.1, 0.1, eyeMat], // eye R
        [0.1, 0.35, 0, 0.9, 0.18, 0.35, finMat],   // dorsal fin
        [0.0,-0.35, 0, 0.7, 0.18, 0.3, finMat],    // ventral fin
        [0.1, 0.0, 0.45, 0.45, 0.15, 0.2, finMat], // pectoral L
        [0.1, 0.0,-0.45, 0.45, 0.15, 0.2, finMat], // pectoral R
    ];
    for (const [x,y,z,w,h,d,mat] of vox) group.add(createVoxel(x,y,z,w,h,d,mat));
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
    fish.rotation.y = ud.baseRotY + Math.sin(ud.swimTimer * ud.swimFrequency) * 0.2;
}

export function isFishPastLog(fish) {
    return fish && fish.position.z > 3.5;
}