import * as THREE from 'three';

const darkBrownMat = new THREE.MeshLambertMaterial({ color: 0x4a2d1e });
const rockMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
const treeTrunkMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
const treeLeavesMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });

function createVoxel(x, y, z, w, h, d, mat) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return mesh;
}

function createMountainSide(isLeft) {
    const group = new THREE.Group();
    const sign = isLeft ? -1 : 1;
    const baseWidth = 8, baseDepth = 20, startY = 2, endY = -20, riverEdge = 4;
    let currentY = startY, layerCount = 0;
    while (currentY > endY) {
        layerCount++;
        const layerHeight = 3 + Math.random() * 3;
        const widthIncrease = Math.random() * 2;
        const depthIncrease = Math.random() * 2;
        const layerWidth = baseWidth + (layerCount * widthIncrease);
        const layerDepth = baseDepth + (layerCount * depthIncrease);
        const layerX = sign * (riverEdge + layerWidth / 2 + (Math.random() - 0.5));
        const layerZ = -5 + (Math.random() - 0.5) * 2;
        const layerY = currentY - layerHeight / 2;
        group.add(createVoxel(layerX, layerY, layerZ, layerWidth, layerHeight, layerDepth, rockMat));
        const detailRocks = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < detailRocks; i++) {
            const size = 1 + Math.random() * 2;
            const detailX = sign * (riverEdge + Math.random() * layerWidth - (layerWidth / 2)) + layerX;
            const detailY = currentY + size / 2;
            const detailZ = layerZ + (Math.random() - 0.5) * layerDepth;
            group.add(createVoxel(detailX, detailY, detailZ, size, size, size, rockMat));
        }
        currentY -= layerHeight;
    }
    return group;
}

function createTree(x, y, z) {
    const group = new THREE.Group();
    const trunkHeight = 1 + Math.random();
    const leavesHeight = 2 + Math.random() * 2;
    group.add(createVoxel(0, trunkHeight/2, 0, 0.5, trunkHeight, 0.5, treeTrunkMat));
    group.add(createVoxel(0, trunkHeight + leavesHeight/2 - 0.5, 0, 1.5, leavesHeight, 1.5, treeLeavesMat));
    group.position.set(x, y, z);
    return group;
}

export function createScenery() {
    const group = new THREE.Group();
    const logGeo = new THREE.CylinderGeometry(0.7, 0.7, 9, 8);
    const log = new THREE.Mesh(logGeo, darkBrownMat);
    log.name = "log";
    log.rotation.z = Math.PI / 2;
    log.position.set(0, 2.7, 4);
    group.add(log);
    const leftMountain = createMountainSide(true);
    const rightMountain = createMountainSide(false);
    group.add(leftMountain);
    group.add(rightMountain);
    group.add(createTree(-7, 2, 0));
    group.add(createTree(-8, 2, -5));
    group.add(createTree(-6, 2, -10));
    group.add(createTree(7, 2, -2));
    group.add(createTree(9, 2, 2));
    group.add(createTree(8, 2, -8));
    return group;
}

