const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
)

const renderer = new THREE.WebGLRenderer({antialias: true})

renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x000000, 1)

document.body.appendChild(renderer.domElement)

const {maze, endspot, nextempty} = makemaze(25, 25)

console.log(maze, (endspot[1] / (maze.length - 1)) * 94 - 47, (endspot[0] / (maze[0].length - 1)) * 94 - 47)

var started = false
var locked = false

var cposx = 0
var cposy = 0
var cposz = 0

var moveforward = false
var movebackward = false
var moveleft = false
var moveright = false
var lasttime = performance.now()
var begintime = 0
var currenttime = performance.now()
var velocity = new THREE.Vector3()
var direction = new THREE.Vector3()
var speed = 100

const light = new THREE.PointLight(0xffffff, 3, 10)

camera.position.set(-43, 0, -43)
camera.add(light)
camera.lookAt(cposx, cposy, cposz)

scene.add(camera)

var controls = new THREE.PointerLockControls(camera)

scene.add(controls.getObject())

const cbox = new THREE.Box3().setFromObject(controls.getObject())

var keydown = function(e) {
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

var keyup = function(e) {
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

document.addEventListener("keydown", keydown, false)
document.addEventListener("keyup", keyup, false)

document.body.addEventListener("click", function() {
    controls.lock()
    if (!started) {
        begintime = performance.now()
        started = true
        cleardialogue()
        // dialogue("Welcome. (2)How did you manage to get yourself in a situation like this? (3)One thing is for sure: (1)You are very unfortunate. ")
        // dialogue("Obviously, you are not alone. (2)I am here to be your guide and help you escape this endless maze. (3)Get ready to face The Gloom.")
    }
}, false)
 // slow down enemy attack
function update() {
    if (controls.isLocked == true) {
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

        if (controls.getObject().position.y < 0) {
            velocity.y = 0
            controls.getObject().position.y = 0
        }

        lasttime = time
    }
}

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
    var canvas = renderer.domElement
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
})

function gameloop() {
    if (started) {
        const timer = document.getElementById("time")

        timer.style.display = "block"
        
        var donetime = performance.now() - begintime
        var minutes = Math.floor(donetime / 60000)
        var seconds = ((donetime % 60000) / 1000).toFixed(0)

        timer.innerHTML = `${minutes}m ${seconds}s`
    }

    update()
    renderer.render(scene, camera)

    requestAnimationFrame(gameloop)
}

gameloop()