function makemaze(width, height) {
    const maze = Array(height).fill().map(() => Array(width).fill("#"))

    const directions = [[0, 2], [2, 0], [0, -2], [-2, 0]]

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]
        }

        return array
    }

    function carve(x, y) {
        maze[y][x] = " "

        const sd = shuffle(directions)

        for (const [dx, dy] of sd) {
            const nx = x + dx
            const ny = y + dy

            if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && maze[ny][nx] === "#") {
                maze[ny - dy / 2][nx - dx / 2] = " "
                carve(nx, ny)
            }
        }
    }

    function findend() {
        var deadends = [];

        for (var y = 1; y < height - 1; y++) {
            for (var x = 1; x < width - 1; x++) {
                if (maze[y][x] == " ") {
                    var walls = 0

                    if (maze[y - 1][x] == "#") walls++
                    if (maze[y + 1][x] == "#") walls++
                    if (maze[y][x - 1] == "#") walls++
                    if (maze[y][x + 1] == "#") walls++

                    if (walls == 3) {deadends.push([y, x])}
                }
            }
        }

        return deadends
    }


    carve(1, 1)
    
    const endspots = findend()

    var endspot = [0, 0]

    for (let i of endspots) {
        if (i[0] + i[1] > endspot[0] + endspot[1]) {endspot = i}
    }

    var nextempty = "none"

    if (maze[2][1] == " ") {nextempty = "down"}
    if (maze[1][2] == " ") {nextempty = "right"}
    
    return {maze, endspot, nextempty}
}