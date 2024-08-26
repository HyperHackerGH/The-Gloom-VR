function fullscreen() {
    if (document.documentElement.requestFullscreen) {document.documentElement.requestFullscreen()}
    else if (document.documentElement.mozRequestFullScreen) {document.documentElement.mozRequestFullScreen()}
    else if (document.documentElement.webkitRequestFullscreen) {document.documentElement.webkitRequestFullscreen()}
    else if (document.documentElement.msRequestFullscreen) {document.documentElement.msRequestFullscreen()}
}

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
)

const renderer1 = new THREE.WebGLRenderer({antialias: true})
const renderer2 = new THREE.WebGLRenderer({antialias: true})

renderer1.shadowMap.enabled = true
renderer1.shadowMap.type = THREE.PCFSoftShadowMap
renderer1.setSize(window.innerWidth / 2, window.innerHeight)
renderer1.setClearColor(0x000000, 1)

renderer2.shadowMap.enabled = true
renderer2.shadowMap.type = THREE.PCFSoftShadowMap
renderer2.setSize(window.innerWidth / 2, window.innerHeight)
renderer2.setClearColor(0x000000, 1)

const container1 = document.createElement("div")
const container2 = document.createElement("div")

container1.style.position = "absolute"
container1.style.top = "0"
container1.style.left = "0"
container1.style.width = "50%"
container1.style.height = "100%"
container1.appendChild(renderer1.domElement)

container2.style.position = "absolute"
container2.style.top = "0"
container2.style.right = "0"
container2.style.width = "50%"
container2.style.height = "100%"
container2.appendChild(renderer2.domElement)

document.body.appendChild(container1)
document.body.appendChild(container2)

const { maze, endspot, nextempty } = makemaze(25, 25)

console.log(maze, (endspot[1] / (maze.length - 1)) * 94 - 47, (endspot[0] / (maze[0].length - 1)) * 94 - 47)

var started = false
var locked = false
var done = false

var cposx = 0
var cposy = 0
var cposz = 0

var na = 0
var lastlook = 0
var lookright = 0
var lookleft = 0
var moveforward = false
var movebackward = false
var moveleft = false
var moveright = false
var lasttime = performance.now()
var begintime = 0
var currenttime = performance.now()
var velocity = new THREE.Vector3()
var direction = new THREE.Vector3()
var speed = 50

const light = new THREE.PointLight(0xffffff, 3, 10)

camera.position.set(-43, 0, -43)
camera.add(light)
camera.lookAt(cposx, cposy, cposz)

scene.add(camera)

var controls = new THREE.PointerLockControls(camera)

scene.add(controls.getObject())

const cbox = new THREE.Box3().setFromObject(controls.getObject())

var keydown = function (e) {
    if (started) {
        switch (e.keyCode) {
            case 38:
            case 87:
                moveforward = true
                break
            case 37:
            case 65:
                moveleft = true
                break
            case 40:
            case 83:
                movebackward = true
                break
            case 39:
            case 68:
                moveright = true
                break
        }
    }
}

var keyup = function (e) {
    if (started) {
        switch (e.keyCode) {
            case 38:
            case 87:
                moveforward = false
                break
            case 37:
            case 65:
                moveleft = false
                break
            case 40:
            case 83:
                movebackward = false
                break
            case 39:
            case 68:
                moveright = false
                break
        }
    }
}

function handleorient(event) {
    const {alpha, beta, gamma} = event
    
    var v = 0
    var intensity = 30

    const timer = document.getElementById("time")

    if (gamma < 0 && gamma < -intensity) {v = (gamma + intensity) / (-90 + intensity).toFixed(3)}
    if (gamma > intensity && gamma < 90) {v = (((gamma - intensity) / (90 - intensity)) * -1).toFixed(3)}

    if (v < 0 && v > -0.8) {movebackward = true}
else if (v > 0 && v < 0.8) {moveforward = true}
    else {
        movebackward = false
        moveforward = false
    }
    
    if (gamma > 0) {na = alpha.toFixed(0)}
    else {na = ((alpha + 180) % 360).toFixed(0)}

    if (na > lastlook) {
        lookright = true
        lastlook = na
    }
    else if (na < lastlook) {
        lookleft = true
        lastlook = na
    }
    else {
        lookright = false
        lookleft = false
    }

    //timer.innerHTML = `${lookright}, ${lookleft}`

    // timer.innerHTML = `${gamma.toFixed(0)}, ${alpha.toFixed(0)}`
}

async function devorient() {
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        try {
            const permissionState = await DeviceOrientationEvent.requestPermission()
            if (permissionState === "granted") {window.addEventListener("deviceorientation", handleorient)}
            else {alert("Permission was denied")}
        }
        catch (error) {alert(error)}
    }
    else if ("DeviceOrientationEvent" in window) {window.addEventListener("deviceorientation", handleorient)}
    else {alert("Device orientation is not supported on your device")}
}

document.body.addEventListener("click", function() {
    fullscreen()
    if (!done) {controls.lock()}
    if (!started) {
        devorient()
        begintime = performance.now()
        started = true
        cleardialogue()
    }
}, false)

const floor = new THREE.Mesh(
    new THREE.BoxGeometry(100, 1, 100),
    new THREE.MeshStandardMaterial({color: 0xf0f0f0})
)

floor.position.y = -2

scene.add(floor)

const b = new THREE.Mesh(
    new THREE.BoxGeometry(4, 2, 4),
    new THREE.MeshLambertMaterial({color: 0x00ff00})
)

b.position.x = (endspot[1] / (maze.length - 1)) * 94 - 47
b.position.z = (endspot[0] / (maze[0].length - 1)) * 94 - 47

scene.add(b)

function end(outcome) {
    controls.unlock()
    done = true

    var donetime = performance.now() - begintime
    var minutes = Math.floor(donetime / 60000)
    var seconds = ((donetime % 60000) / 1000).toFixed(0)

    document.getElementById("endtime").innerHTML = `Time: ${minutes}m ${seconds}s`

    if (outcome == "win") {document.getElementById("endtexth").innerHTML = "You have escaped The Gloom."}
    else {document.getElementById("endtexth").innerHTML = "You have failed to escape The Gloom."}

    document.getElementById("end").style.display = "block"
    setTimeout(() => {
        document.getElementsByTagName("canvas")[0].remove()
        document.getElementsByTagName("canvas")[1].remove()
    }, 2500)
}

function update() {
    if (started) {
        var time = performance.now()
        var delta = (time - lasttime) / 1000

        velocity.x -= velocity.x * 10 * delta
        velocity.z -= velocity.z * 10 * delta
        velocity.y -= 1000 * delta
        direction.z = Number(moveforward) - Number(movebackward)
        direction.x = Number(moveleft) - Number(moveright)
        direction.normalize()

        if (moveforward || movebackward) velocity.z -= direction.z * speed * delta
        if (moveleft || moveright) velocity.x -= direction.x * speed * delta

        if (lookright) camera.rotation.y -= 0.05
        if (lookleft) camera.rotation.y += 0.05

        const lastpos = controls.getObject().position.clone()

        controls.getObject().translateX(velocity.x * delta)
        controls.getObject().position.y += (velocity.y * delta)
        controls.getObject().translateZ(velocity.z * delta)

        maze.forEach((v, i) => {
            v.forEach((j, k) => {
                if (j == "#") {
                    const wallx = (k / (maze.length - 1)) * 94 - 47
                    const wallz = (i / (v.length - 1)) * 94 - 47

                    if (Math.abs(controls.getObject().position.x - wallx) < 2.2 && Math.abs(controls.getObject().position.z - wallz) < 2.2) {
                        controls.getObject().position.copy(lastpos)

                        velocity.x = 0
                        velocity.z = 0
                    }
                }
            })
        })

        if (Math.abs(controls.getObject().position.x - b.position.x) < 2.2 && Math.abs(controls.getObject().position.z - b.position.z) < 2.2) {
            controls.getObject().position.copy(lastpos)

            velocity.x = 0
            velocity.z = 0
            end("win")
        }

        if (controls.getObject().position.y < 0) {
            velocity.y = 0
            controls.getObject().position.y = 0
        }

        lasttime = time
    }
}

maze.forEach((v, i) => {
    v.forEach((j, k) => {
        if (j == "#") {
            const b = new THREE.Mesh(
                new THREE.BoxGeometry(4, 2, 4),
                new THREE.MeshLambertMaterial({color: 0xffffff})
            )

            b.position.x = (k / (maze.length - 1)) * 94 - 47
            b.position.z = (i / (v.length - 1)) * 94 - 47

            scene.add(b)
        }
    })
})

if (nextempty == "down") {camera.lookAt(-43, cposy, -42)}
if (nextempty == "right") {camera.lookAt(-42, cposy, -43)}

window.addEventListener("resize", () => {
    renderer1.setSize(window.innerWidth / 2, window.innerHeight)
    renderer2.setSize(window.innerWidth / 2, window.innerHeight)

    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
})

function gameloop() {
    if (started && !done) {
        const timer = document.getElementById("time")

        timer.style.display = "block"

        var donetime = performance.now() - begintime
        var minutes = Math.floor(donetime / 60000)
        var seconds = ((donetime % 60000) / 1000).toFixed(0)

        timer.innerHTML = `${minutes}m ${seconds}s`
    }

    update()
    renderer1.render(scene, camera)
    renderer2.render(scene, camera)

    requestAnimationFrame(gameloop)
}

gameloop()