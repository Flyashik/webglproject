import '../style.css'
import * as THREE from 'three'
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";

const canvas = document.getElementById("canvas");
const width = window.innerWidth;
const height = window.innerHeight;
canvas.setAttribute('width', width);
canvas.setAttribute('height', height);

const renderer = new THREE.WebGLRenderer({canvas: canvas});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
camera.position.set(0, 7, -2);

//global light
let isGlobalLightOn = true;
const moonLight = new THREE.DirectionalLight(0xffffff, 0.1);
moonLight.position.set(0, 10, 0);

moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 512;
moonLight.shadow.mapSize.height = 512;
moonLight.shadow.camera.near = 0.5;
moonLight.shadow.camera.far = 50;

scene.add(moonLight);

const moonLightColor = new THREE.Color(0x808080);
const moonLightIntensity = 0.3;

scene.traverse((object) => {
    if (object.isMesh) {
        object.receiveShadow = true;
        object.material.emissive = moonLightColor;
        object.material.emissiveIntensity = moonLightIntensity;
    }
});

//skybox
const skyMaterial = new THREE.MeshStandardMaterial({ color: 0x040124, side: THREE.BackSide });
const skyGeo = new THREE.SphereGeometry(1000, 25, 25);
const skybox = new THREE.Mesh(skyGeo, skyMaterial);
skybox.position.set(0, 200, 10);
skybox.add(moonLight);
scene.add(skybox);

const loader = new GLTFLoader();
function loadModel(url) {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(url, (obj) => {
            resolve(obj.scene);
        }, undefined, reject);
    });
}

//car
let car;
async function initCar() {
    car = await loadModel('resources/car.glb');

    processCar();
}
function processCar() {
    car.position.set(0, 1, 10);
    car.scale.set(1, 1, 1);
    car.rotation.y = Math.PI;

    processLightCar(1);

    scene.add(car);
    camera.lookAt(car.position);
}

let isCarLightOn = true;
function processLightCar() {
    //фары
    let frontLight1 = new THREE.SpotLight(0xffffff, 1, 30, Math.PI / 6, 0.1);
    let frontLight2 = new THREE.SpotLight(0xffffff, 1, 30, Math.PI / 6, 0.1);
    let backLight1 = new THREE.SpotLight(0xff0000, 1, 3, Math.PI / 3, 0.1);
    let backLight2 = new THREE.SpotLight(0xff0000, 1, 3, Math.PI / 3, 0.1);

    frontLight1.position.set(0.7, 0.3, -1.8);
    frontLight1.target.position.set(car.position.x, car.position.y, 100);
    frontLight1.lookAt(frontLight1.target.position);
    frontLight2.position.set(-0.7, 0.3, -1.8);
    frontLight2.target.position.set(car.position.x, car.position.y, 100);
    frontLight2.lookAt(frontLight2.target.position);

    backLight1.position.set(0.5, 0.3, 0.3);
    backLight2.position.set(-0.5, 0.3, 0.3);

    //неон
    let neonLight = new THREE.PointLight(0x00ff00, 1, 3);
    neonLight.target = car;
    neonLight.position.set(0, 0, -1.7);

    car.add(frontLight1);
    car.add(frontLight2);
    car.add(backLight1);
    car.add(backLight2);
    car.add(neonLight);

    scene.add(frontLight1.target);
    scene.add(frontLight2.target);
    scene.add(backLight1.target);
    scene.add(backLight2.target);
}

//road
let frameList = [];
const roadTexture = new THREE.TextureLoader().load('resources/textures/asphalt.jpg');
const sandTexture = new THREE.TextureLoader().load('resources/textures/sand.jpg');

let barrier;
async function loadBarrierModel() {
    try {
        barrier = await loadModel('resources/barrier.glb');
        barrier.rotation.y = -Math.PI / 2;
        barrier.scale.set(2, 1, 1);
    } catch (error) {
        console.error('Failed to load barrier model:', error);
    }
}

let streetLight;
async function loadStreetLight() {
    try {
        streetLight = await loadModel('resources/street-light.glb');
    } catch (error) {
        console.error('Failed to load barrier model:', error);
    }
}

async function initRoad() {
    await loadBarrierModel();
    await loadStreetLight();
    for (let i = 0; i < 15; i++) {
        const barrierLeftInstance = barrier.clone();
        barrierLeftInstance.position.set(7.5, 0, i * 15 - 15);
        const barrierRightInstance = barrier.clone();
        barrierRightInstance.position.set(-7.5, 0, i * 15 - 15);

        const streetLightLeft = streetLight.clone();
        streetLightLeft.position.set(8, 0, i * 15 - 15);
        streetLightLeft.rotation.y = Math.PI / 2;
        const streetLightRight = streetLight.clone();
        streetLightRight.position.set(-8, 0, i * 15 - 15);
        streetLightRight.rotation.y = -Math.PI / 2;


        let frame = {
            roadPlate: createRoadPlate(i * 15 - 15),
            leftSandPlate: createSandPlate(-15, i * 15 - 15),
            rightSandPlate: createSandPlate(15, i * 15 - 15),
            leftMarker: createMarker(-6.5, i * 15 - 15),
            centerMarker: createMarker(0, i * 15 - 15, 6),
            rightMarker: createMarker(6.5, i * 15 - 15),
            leftBarrier: barrierLeftInstance,
            rightBarrier: barrierRightInstance,
            leftStreetLight: streetLightLeft,
            rightStreetLight: streetLightRight,
            lightLeft: createLight(4, i * 15 - 15, streetLightIntensity),
            lightRight: createLight(-4, i * 15 - 15, streetLightIntensity),
        }

        frameList.unshift(frame);
        scene.add(frame.roadPlate);
        scene.add(frame.leftSandPlate);
        scene.add(frame.rightSandPlate);
        scene.add(frame.leftMarker);
        scene.add(frame.centerMarker);
        scene.add(frame.rightMarker);
        scene.add(frame.leftBarrier);
        scene.add(frame.rightBarrier);
        scene.add(frame.leftStreetLight);
        scene.add(frame.rightStreetLight);
        scene.add(frame.lightLeft);
        scene.add(frame.lightRight);
    }
}

function createRoadPlate(posZ) {
    let geometry = new THREE.PlaneGeometry(15, 15);
    let mesh = new THREE.MeshStandardMaterial({map: roadTexture});

    let plate = new THREE.Mesh(geometry, mesh);
    plate.rotation.x = -Math.PI / 2;
    plate.position.z = posZ;

    return plate;
}

function createSandPlate(posX, posZ) {
    let geometry = new THREE.PlaneGeometry(15, 15);
    let mesh = new THREE.MeshStandardMaterial({map: sandTexture})

    let plate = new THREE.Mesh(geometry, mesh);
    plate.rotation.x = -Math.PI / 2;
    plate.position.x = posX;
    plate.position.z = posZ;

    return plate;
}

function createMarker(posX, posZ, height = 15) {
    let geometry = new THREE.PlaneGeometry(0.5, height);
    let mesh = new THREE.MeshStandardMaterial({color: 0xffffff});

    let plate = new THREE.Mesh(geometry, mesh);
    plate.rotation.x = -Math.PI / 2;
    plate.position.x = posX;
    plate.position.z = posZ;
    plate.position.y = 0.01;

    return plate;
}

let streetLightIntensity = 0.5;
function createLight(posX, posZ, intensity) {
    let light = new THREE.PointLight(0xffa126, intensity, 10);
    light.position.set(posX, 3, posZ);

    return light;
}

let speed = 0.5;
function updateRoad() {
    for (let i = 0; i < frameList.length; i++) {
        let frame = frameList[i];
        frame.roadPlate.position.z -= speed;
        frame.leftSandPlate.position.z -= speed;
        frame.rightSandPlate.position.z -= speed;
        frame.leftMarker.position.z -= speed;
        frame.centerMarker.position.z -= speed;
        frame.rightMarker.position.z -= speed;
        frame.leftBarrier.position.z -= speed;
        frame.rightBarrier.position.z -= speed;
        frame.leftStreetLight.position.z -= speed;
        frame.rightStreetLight.position.z -= speed;
        frame.lightLeft.position.z -= speed;
        frame.lightRight.position.z -= speed;

        if (frame.roadPlate.position.z < -15) {
            scene.remove(frame.roadPlate);
            scene.remove(frame.leftSandPlate);
            scene.remove(frame.rightSandPlate);
            scene.remove(frame.leftMarker);
            scene.remove(frame.centerMarker);
            scene.remove(frame.rightMarker);
            scene.remove(frame.leftBarrier);
            scene.remove(frame.leftStreetLight);
            scene.remove(frame.rightStreetLight);
            scene.remove(frame.lightLeft);
            scene.remove(frame.lightRight);
            frameList.splice(i, 1);

            let barrierLeft = barrier.clone();
            barrierLeft.position.set(7.5, 0, frameList.length * i);
            let barrierRight = barrier.clone();
            barrierRight.position.set(-7.5, 0, frameList.length * i);

            const streetLightLeft = streetLight.clone();
            streetLightLeft.position.set(8, 0, frameList.length * i);
            streetLightLeft.rotation.y = Math.PI / 2;
            const streetLightRight = streetLight.clone();
            streetLightRight.position.set(-8, 0, frameList.length * i);
            streetLightRight.rotation.y = -Math.PI / 2;

            let newFrame = {
                roadPlate: createRoadPlate(frameList.length * i),
                leftSandPlate: createSandPlate(-15, frameList.length * i),
                rightSandPlate: createSandPlate(15, frameList.length * i),
                leftMarker: createMarker(-6.5, frameList.length * i),
                centerMarker: createMarker(0, frameList.length * i, 6),
                rightMarker: createMarker(6.5, frameList.length * i),
                leftBarrier: barrierLeft,
                rightBarrier: barrierRight,
                leftStreetLight: streetLightLeft,
                rightStreetLight: streetLightRight,
                lightLeft: createLight(4, frameList.length * i, streetLightIntensity),
                lightRight: createLight(-4, frameList.length * i, streetLightIntensity),
            };

            frameList.unshift(newFrame);
            scene.add(newFrame.roadPlate);
            scene.add(newFrame.leftSandPlate);
            scene.add(newFrame.rightSandPlate);
            scene.add(newFrame.leftMarker);
            scene.add(newFrame.centerMarker);
            scene.add(newFrame.rightMarker);
            scene.add(newFrame.leftBarrier);
            scene.add(newFrame.rightBarrier);
            scene.add(newFrame.leftStreetLight);
            scene.add(newFrame.rightStreetLight);
            scene.add(newFrame.lightLeft);
            scene.add(newFrame.lightRight);
        }
    }
}

initCar();
initRoad();
function animate() {
    requestAnimationFrame(animate);

    updateRoad();

    for (let i = 0; i < animateObstacleList.length; i++) {
        animateObstacleList[i]();
    }

    renderer.render(scene, camera);
}


var currentRotation = 0;
var maxRotation = Math.PI / 12;
document.addEventListener("keydown", (event) => {
    if (event.code === 'KeyA') {
        if (car.position.x < 5.5) {
            car.position.x += 0.2;

            car.traverse(child => {
                if (child.isSpotLight) {
                    child.target.position.x = car.position.x;
                }
            });

            if (currentRotation < maxRotation) {
                car.rotation.y += 0.02;
                currentRotation += 0.02;
            }
        } else {
            car.rotation.y = -Math.PI;
            currentRotation = 0;
        }
    }
    if (event.code === 'KeyD') {
        if (car.position.x > -5.5) {
            car.position.x -= 0.2;

            car.traverse(child => {
                if (child.isSpotLight) {
                    child.target.position.x = car.position.x;
                }
            });

            if (currentRotation > -maxRotation) {
                car.rotation.y -= 0.02;
                currentRotation -= 0.02;
            }
        } else {
            car.rotation.y = -Math.PI;
            currentRotation = 0;
        }
    }
});

document.addEventListener("keyup", (event) => {
    if (event.code === 'KeyA' || event.code === 'KeyD') {
        car.rotation.y = -Math.PI;
        currentRotation = 0;
    }

    if (event.code === 'KeyF') {
        isCarLightOn = !isCarLightOn;
        car.traverse(child => {
            if (child.isLight) {
                child.intensity = isCarLightOn ? 1 : 0;
            }
        });
    }

    if (event.code === 'Digit1') {
       isGlobalLightOn = !isGlobalLightOn;
       moonLight.intensity = isGlobalLightOn ? 0.1 : 0;
    }

    if (event.code === 'Digit2') {
        streetLightIntensity = streetLightIntensity > 0 ? 0 : 0.5;
    }
});

let obstacleList = [];
let animateObstacleList = [];

initObstacles();
generateRandomObstacle();
animate();

async function initObstacles() {
    obstacleList[0] = await loadModel('resources/obstacle1.glb');
    obstacleList[1] = await loadModel('resources/obstacle2.glb');
    obstacleList[0].position.set(0, 0, 0);
    obstacleList[0].rotation.y = -Math.PI / 2;
    obstacleList[1].position.set(0, 0, 0);
}

function generateRandomObstacle() {
    setInterval(() => {
        let ind = getRandomInt(0, obstacleList.length - 1);
        let curObstacle = obstacleList[ind].clone();

        curObstacle.position.set(getRandom(-5.5, 5.5), 0, frameList.length * 15 - 15);
        scene.add(curObstacle);

        let endPosition = -15 * frameList.length;
        let removalPosition = endPosition - 15;

        function removeObstacle() {
            if (curObstacle.position.z <= removalPosition) {
                scene.remove(curObstacle);
                curObstacle = null;
                clearInterval(removeInterval);
            }
        }

        let removeInterval = setInterval(removeObstacle, 10);

        function animateObstacle() {
            if (curObstacle) {
                curObstacle.position.z -= speed;

                checkCollision(car, curObstacle);
            }
        }

        animateObstacleList.push(animateObstacle);
    }, Math.random() * 6000);
}

function checkCollision(car, obstacle) {
    const carX = car.position.x;
    const carZ = car.position.z;

    const obstacleX = obstacle.position.x;
    const obstacleZ = obstacle.position.z;

    if (Math.abs(carX - obstacleX) < getObstacleSize(obstacle).x && Math.abs(carZ - obstacleZ) < getObstacleSize(obstacle).z) {
        car.position.x = 0.0;
        scene.remove(obstacle);
    }
}

function getObstacleSize(obstacle) {
    const box = new THREE.Box3();
    box.setFromObject(obstacle);

    const size = new THREE.Vector3();
    box.getSize(size);

    return size;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}