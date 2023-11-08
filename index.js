const ppm = require('ppm');
const fs = require('fs');

function compressImage(filePath) {
    let stream = fs.createReadStream(filePath);

    ppm.parse(stream, (err, image) => {
        if (err) throw err;

        let compressedImage = image.map(rleCompress);

        fs.writeFileSync('compressed_image.txt', JSON.stringify(compressedImage));
    });
}

function rleCompress(line) {
    let pixel = lastPixel = []
    let r = []
    let g = []
    let b = []
    let redCounter = 1
    let greenCounter =  1
    let blueCounter = 1;
    const width = line.length

    for (let i = 0; i < line.length; i++) {
        pixel = line[i]
        nextPixel = line[i + 1]

        if (!nextPixel) nextPixel = [-1, -1, -1] 

        // Red        
        if (pixel[0] == nextPixel[0]) {
            redCounter++
        } else {
            r.push({quantity: redCounter, value: pixel[0]})
            redCounter = 1
        }

        // Green
        if (pixel[1] == nextPixel[1]) {
            greenCounter++
        } else {
            g.push({quantity: greenCounter, value: pixel[1]})
            greenCounter = 1
        }

        // Blue
        if (pixel[2] == nextPixel[2]) {
            blueCounter++
        } else {
            b.push({quantity: blueCounter, value: pixel[2]})
            blueCounter = 1
        }
        
    }

    return `${lineToString(r)}\n${lineToString(g)}\n${lineToString(b)}`
}

function lineToString(line) {
    let pixel = null
    let diffCounter = 0
    let diffValues = []
    let result = []

    if (line.length == 1)
        return line[0].quantity + ',' + line[0].value

    for (var i = 0; i < line.length; i++) {
        pixel = line[i]

        if (pixel.quantity == 1) {
            diffCounter++
            diffValues.push(pixel.value)

            if (i != line.length - 1) continue
        }

        if (diffCounter > 0 || i == line.length - 1) {
            result.push('-' + diffCounter)
            diffValues.forEach(value => result.push(value))
            diffCounter = 0;
            diffValues = []
        } 
        
        if (pixel.quantity > 1) {
            let quantity = pixel.quantity
            if (quantity > 127) {
                let auxQuantity = pixel.quantity - 127
                quantity = 127
                result.push(auxQuantity)
                result.push(pixel.value)
            }

            result.push(pixel.quantity)
            result.push(pixel.value)
        }
    }

    return result.join(',')
}

function compressImage(filePath, newFilePath) {
    let stream = fs.createReadStream(filePath);

    ppm.parse(stream, (err, image) => {
        if (err) throw err;

        const height = image.length
        const width = image[0].length
        const compressed = image.map(line => rleCompress(line)).join('\n')
        
        fs.writeFileSync(newFilePath, `${width} ${height}\n${compressed}`);
    });
}

function decompressImage(filePath, newFilePath) {
    let data = fs.readFileSync(filePath, 'utf8').split('\n');
    let width = Number(data[0].split(' ')[0]);
    let height = Number(data[0].split(' ')[1]);

    data.shift()

    let red = []
    let green = []
    let blue = []
    let newLine = []
    let result = []

    for (let y = 0; y < data.length; y++) {
        let rLine = data[y].split(',')
        let gLine = data[y + 1].split(',')
        let bLine = data[y + 2].split(',')

        y = y + 2

        for (let redCounter = 0; redCounter < rLine.length; redCounter++) {
            if (Number(rLine[redCounter] > 0)) {
                redCounter++
                for (let equalCounter = 0; equalCounter < rLine[redCounter]; equalCounter++) {
                    red.push(rLine[redCounter])
                }
            } else {
                let number = Number(rLine[redCounter]) * (-1)
                for (let diffCounter = 0; diffCounter < number; diffCounter++) {
                    redCounter++
                    red.push(rLine[redCounter])
                }
            }
        }

        for (let greenCounter = 0; greenCounter < gLine.length; greenCounter++) {
            if (Number(gLine[greenCounter] > 0)) {
                greenCounter++
                for (let equalCounter = 0; equalCounter < gLine[greenCounter]; equalCounter++) {
                    green.push(gLine[greenCounter])
                }
            } else {
                let number = Number(gLine[greenCounter]) * (-1)
                for (let diffCounter = 0; diffCounter < number; diffCounter++) {
                    greenCounter++
                    green.push(gLine[greenCounter])
                }
            }
        }

        for (let blueCounter = 0; blueCounter < bLine.length; blueCounter++) {
            if (Number(bLine[blueCounter] > 0)) {
                blueCounter++
                for (let equalCounter = 0; equalCounter < bLine[blueCounter]; equalCounter++) {
                    blue.push(bLine[blueCounter])
                }
            } else {
                let number = Number(bLine[blueCounter]) * (-1)
                for (let diffCounter = 0; diffCounter < number; diffCounter++) {
                    blueCounter++
                    blue.push(bLine[blueCounter])
                }
            }
        }

        for (let newLineCounter = 0; newLineCounter < width; newLineCounter++) {
            newLine.push([red[newLineCounter], green[newLineCounter], blue[newLineCounter]].join(' '))
        }

        result.push(newLine.join(' '))
        red = []
        green = []
        blue = []
        newLine = []
    }
    
    fs.writeFileSync(newFilePath, `P3\n${ width } ${ height }\n255\n${ result.join('\n') }`);
}

// compressImage('./images/Fig1.ppm', './compressed/compressed_fig1.txt')
// compressImage('./images/Fig4.ppm', './compressed/compressed_fig4.txt')

decompressImage('./compressed/compressed_fig1.txt', './decompressed/compressed_fig1.ppm')
decompressImage('./compressed/compressed_fig4.txt', './decompressed/compressed_fig4.ppm')