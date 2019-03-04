let $wrapper = document.getElementById('wrapper'),
    $welcome = document.getElementById('welcome'),
    $welcomeWrapper = document.getElementById('welcome-wrapper'),
    $uploadForm = document.getElementById('upload-form'),
    $fileInput = document.getElementById('file-input'),
    $cornerstone = document.getElementById('cornerstone'),
    $programWrapper = document.getElementById('program-wrapper');


class Code {

    constructor(chain, tables) {
        this.chain = chain;
        this.tables = tables;
        this.cursorPos = {
            x: 0,
            y: 0
        };

        this.lineOffset = 7;

        this.tokens = [[]];
        this.cornerstone = {
            'width': $cornerstone.offsetWidth,
            'height': $cornerstone.offsetHeight
        };

        this.$cursor = document.createElement('div');
        this.$cursor.className = 'text-cursor';
        this.$cursor.style.height = this.cornerstone.height;

        this.selection = {
            x: 0,
            y: 0,
            width: 0
        };

        this.$selectionWrapper = document.createElement('div');
        this.$selectionWrapper.className = 'selection-wrapper';
        this.$selectionWrapper.style.height = this.cornerstone.height;

        this.$selection = document.createElement('div');
        this.$selection.className = 'selection';

        this.$selectionWrapper.appendChild(this.$selection);


        this.$breakLine = document.createElement('div');
        this.$breakLine.className = 'break-line';

        this.$indent = document.createElement('div');
        this.$indent.classList.add('token', 'indent');
        this.$indent.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;';

        this.$space = document.createElement('div');
        this.$space.classList.add('token', 'space');
        this.$space.innerHTML = '&nbsp;';

        if (this.chain && this.tables) {
            $programWrapper.innerHTML = '';

            let tokenNumberInLine = 0;
            let varFlag = false,
                constFlag = false,
                thenFlag = false,
                beginFlag = false,
                endFlag = false,
                thenComboCounter = 0;

            let indent = 0;
            let numberOfLine = 0;

            for (let i = 0; i < this.chain.length; i++) {
                let $newToken = document.createElement('div');
                $newToken.classList.add('token', this.chain[i][3]);
                $newToken.innerText = this.chain[i][2];

                if (this.chain[i].length > 4) {
                    if (this.chain[i][4] === 'string') {
                        $newToken.innerText = '\'' + this.chain[i][2] + '\'';
                    }
                    $newToken.classList.add(this.chain[i][4]);
                }

                if (this.chain[i][2] === ':=') {
                    $newToken.classList.add('assignment');
                }

                if (this.chain[i][2] === 'else') {
                    $programWrapper.appendChild(this.$breakLine.cloneNode());
                    this.tokens.push([]);
                    numberOfLine++;
                    tokenNumberInLine = 0;
                    beginFlag = false;
                    endFlag = false;
                }

                if ((this.chain[i][2] === 'end') || (this.chain[i][2] === 'end.')
                    || (this.chain[i][2] === 'else')
                    || ((varFlag) && (this.chain[i][3] === 'service-word')
                        && (this.chain[i][2] !== 'array') && (this.chain[i][2] !== 'of')
                        && (this.chain[i][2] !== 'integer') && (this.chain[i][2] !== 'real')
                        && (this.chain[i][2] !== 'string'))
                    || ((constFlag) && (this.chain[i][3] === 'service-word'))) {
                    indent--;
                    varFlag = false;
                    constFlag = false;
                }

                if (tokenNumberInLine === 0) {
                    for (let j = 0; j < indent; j++) {
                        $programWrapper.appendChild(this.$indent.cloneNode(true));
                        // this.tokens.push(this.$indent.cloneNode());
                    }
                }

                console.log(this.chain[i][2], this.chain[i][3], indent, numberOfLine);

                $programWrapper.appendChild($newToken);
                this.tokens[this.tokens.length-1].push($newToken);

                let transitionX = getRndInteger(20, 50),
                    transitionY = getRndInteger(-400, -1000) - (numberOfLine + this.lineOffset) * this.cornerstone.height;

                let angle1 = 0; // getRndInteger(-10, -20) * 0;
                // while (Math.abs(angle1) < 10) {
                //     angle1 = getRndInteger(-100, 100)
                // }

                let angle2 = getRndInteger(-180, 180);
                while (Math.abs(angle2) < 50) {
                    angle2 = getRndInteger(-360, 360)
                }
                $newToken.style.transform = 'rotate(' + angle1 + 'deg) translate(' + transitionX + 'vw, '
                    + transitionY + 'px) scale(0) rotate(' + angle2 + 'deg)';

                reflow($newToken);


                if ((this.chain[i][2] !== '(') && (this.chain[i][2] !== '[')
                    && (this.chain[i][2] !== '+') && (this.chain[i][2] !== '-')
                    && (this.chain[i][2] !== '*') && (this.chain[i][2] !== '/')
                    && (this.chain[i][2] !== ';') && (this.chain[i][2] !== 'begin')
                    && (this.chain[i][2] !== 'var') && (this.chain[i][2] !== 'const')
                    && (this.chain[i][2] !== 'then') && (this.chain[i][2] !== 'else')) {
                    if ((i + 1 < this.chain.length) && (this.chain[i + 1][2])) {
                        if ((this.chain[i + 1][2] !== ';') && (this.chain[i + 1][2] !== ':')
                            && (this.chain[i + 1][2] !== ',') && (this.chain[i + 1][2] !== ']')
                            && (this.chain[i + 1][2] !== ')') && (this.chain[i + 1][2] !== '+')
                            && (this.chain[i + 1][2] !== '-') && (this.chain[i + 1][2] !== '*')
                            && (this.chain[i + 1][2] !== '/')) {
                            $programWrapper.appendChild(this.$space.cloneNode(true));
                            // this.tokens.push(this.$space.cloneNode());
                        }
                    }
                }

                tokenNumberInLine++;

                if (this.chain[i][2] === ';') {
                    $programWrapper.appendChild(this.$breakLine.cloneNode());
                    this.tokens.push([]);
                    numberOfLine++;
                    tokenNumberInLine = 0;

                    if (thenFlag) {
                        indent -= thenComboCounter + 1;
                        thenComboCounter = 0;
                        thenFlag = false;
                    }

                    if ((beginFlag) && (endFlag) && (thenFlag)) {
                        indent -= 2;
                        beginFlag = false;
                    }
                }

                if ((this.chain[i][2] === 'var') || (this.chain[i][2] === 'begin')
                    || (this.chain[i][2] === 'then') || (this.chain[i][2] === 'else')
                    || (this.chain[i][2] === 'const')) {
                    $programWrapper.appendChild(this.$breakLine.cloneNode());
                    this.tokens.push([]);
                    numberOfLine++;
                    tokenNumberInLine = 0;
                    indent++;
                }

                if ((this.chain[i][2] === 'var')) {
                    varFlag = true;
                }

                if ((this.chain[i][2] === 'const')) {
                    constFlag = true;
                }

                if ((this.chain[i][2] === 'then') || (this.chain[i][2] === 'else')) {
                    thenFlag = true;
                    if (!beginFlag) {
                        thenComboCounter++;
                    }
                }

                if (this.chain[i][2] === 'begin') {
                    thenFlag = false;
                    beginFlag = true;
                }

                if (this.chain[i][2] === 'end') {
                    endFlag = true;
                }

                if ((this.chain[i][2] === ':') && (!varFlag)) {
                    $programWrapper.appendChild(this.$breakLine.cloneNode());
                    this.tokens.push([]);
                    numberOfLine++;
                    tokenNumberInLine = 0;
                }
            }

            let that = this;
            setTimeout(function () {
                that.programOnset(that.tokens.length-1);
            }, 50);
        }

        $programWrapper.style.top = (100 - (1.6 * this.cornerstone.height / window.innerHeight) * 100) + 'vh';
        $programWrapper.appendChild(this.$cursor);
        reflow(this.$cursor);

        $programWrapper.appendChild(this.$selectionWrapper);
        reflow(this.$selectionWrapper);
    }

    hideSelection() {
        this.$selection.style.opacity = '0';
        this.$selection.style.right = '100%';
        this.$selection.style.left = '0';
    }

    // showSelection() {
    //     this.$selection.style.opacity = '1';
    // }

    setSelection(x, y, width, leftToRight, callback) {
        let duration = 100;
        this.$selection.style.transitionDuration = duration / 1000 + 's';

        this.$selectionWrapper.style.left = x * this.cornerstone.width + 'px';
        this.$selectionWrapper.style.top = y * this.cornerstone.height + 'px';
        this.$selectionWrapper.style.width = width * this.cornerstone.width + 'px';

        if (leftToRight) {
            this.$selectionWrapper.style.transform = 'rotate(0deg)';
            this.setCursor(x + width, y);
        } else {
            this.$selectionWrapper.style.transform = 'rotate(180deg)';
            this.setCursor(x, y);
        }

        this.$selection.style.right = '100%';
        this.$selection.style.left = '0';

        this.$selection.style.right = '0';

        this.selection.x = x;
        this.selection.y = y;
        this.selection.width = width;

        if (typeof callback == "function") {
            setTimeout(function() {
                callback()
            }, duration);
        }
    }

    setCursor(x, y) {
        this.cursorPos = {
            x: x,
            y: y
        };

        this.$cursor.style.left = this.cursorPos.x * this.cornerstone.width + 'px';
        this.$cursor.style.top = this.cursorPos.y * this.cornerstone.height + 'px';
        this.$cursor.style.display = 'block';

        console.log('cursor', this.$cursor.style.left, this.$cursor.style.top);
    }

    moveCursor(x, y, callback) {
        if ((x !== this.cursorPos.x) || (y !== this.cursorPos.y)) {
            this.$cursor.classList.add('non-animation');
            // console.log(this.cursorPos.x, '!=', x);
            // console.log(this.cursorPos.y, '!=', y);
            if (y !== this.cursorPos.y) {
                if (y > this.cursorPos.y) {
                    this.cursorPos.y++;
                } else {
                    this.cursorPos.y--;
                }
            } else if (x !== this.cursorPos.x) {
                if (x > this.cursorPos.x) {
                    this.cursorPos.x++;
                } else {
                    this.cursorPos.x--;
                }
            }

            this.$cursor.style.left = this.cursorPos.x * this.cornerstone.width + 'px';
            this.$cursor.style.top = this.cursorPos.y * this.cornerstone.height + 'px';
            this.$cursor.style.display = 'block';

            let that = this;
            setTimeout(function() {
                that.moveCursor(x, y, callback);
            }, getRndInteger(80, 250));
        } else {
            this.$cursor.classList.remove('non-animation');
            if (typeof callback == 'function') {
                callback();
            }
        }
    }

    appendNode(text, x, y, callback) {
        let that = this;

        let $newNode = document.createElement('div');
        $newNode.classList.add('token', 'node');
        $newNode.innerText = text;
        $newNode.style.top = y * this.cornerstone.height + 'px';
        $newNode.style.left = x * this.cornerstone.width + 'px';
        $newNode.style.width = '0';
        $newNode.style.transitionDuration = '0.1s';

        $programWrapper.appendChild($newNode);
        reflow($newNode);

        this.setCursor(x, y);

        typing(1700);

        function typing(duration) {
            setTimeout(function() {
                that.$cursor.classList.add('non-animation');
                if (that.cursorPos.x < x + text.length) {
                    that.setCursor(that.cursorPos.x + 1, y);
                    $newNode.style.width = (that.cursorPos.x - x) * that.cornerstone.width;

                    let delay = getRndInteger(200, 500);
                    if (text[that.cursorPos.x - x - 1] === text[that.cursorPos.x - x]) {
                        delay = getRndInteger(100, 200)
                    }
                    typing(delay);
                } else {
                    that.$cursor.classList.remove('non-animation');
                    callback();
                }
            }, duration);
        }

        return $newNode;
    }

    programOnset(lineIndex) {
        let that = this;
        this.tokens[lineIndex].forEach(function (element) {
            element.style.transitionDuration = '1.2s';
            element.style.transitionTimingFunction = 'ease-out';
            // console.log(lineIndex);
            element.style.transform = 'rotate(0deg) translate(0vw, ' + ( -(lineIndex + that.lineOffset) * that.cornerstone.height) + 'px) scale(1) rotate(0deg)';
            setTimeout(function () {
                element.style.transitionDuration = (0.38 * (lineIndex + 1)) +'s';
                element.style.transitionTimingFunction = 'linear';
                element.style.transform = 'rotate(0deg) translate(0vw, ' + (-(that.lineOffset - 1) * that.cornerstone.height) + 'px) scale(1) rotate(0deg)';
                setTimeout(function() {
                    element.style.transitionDuration = 0.17 * 2 +'s';
                    element.style.transitionTimingFunction = 'ease-in-out';
                    element.style.transform = 'none';
                }, (0.38 * (lineIndex + 1)) * 1000);
            }, 1200);
        });

        if (lineIndex > 0) {
            setTimeout(function () {
                that.programOnset(lineIndex - 1);
            }, 380);
        } else {
            console.log(this.tokens);
            setTimeout(function() {
                that.setCursor(0, -7);
                let $321Node = that.appendNode('3.. 2.. 1..', 0, -7, function() {
                    that.setSelection(0, -7, '3.. 2.. 1..'.length, false, function() {
                        setTimeout(function() {
                            that.hideSelection();
                            $321Node.style.display = 'none';
                            that.moveCursor(0, 0);
                        }, 300)
                    })
                })
            }, 2400);
        }
    }
}

if (sessionStorage.getItem('chain') != null) {

    let code = new Code(
        JSON.parse(sessionStorage.getItem('chain')),
        JSON.parse(sessionStorage.getItem('tables'))
    );
} else {
    $welcomeWrapper.classList.remove('hide');
}

// code.moveCursor(0, -7);
// code.appendNode('', 0, -7, function() {
//     code.setSelection(0, -7, '3213456789098765435678987'.length, false)
// });

function welcomeDepart() {
    let words = document.getElementsByClassName('welcome-word');
    for (let i = 0; i < words.length; i++) {
       let angle = getRndInteger(-100, 100);
       let transitionX = getRndInteger(-100, 100),
           transitionY = getRndInteger(-500, -50);
       let scale = Math.sqrt(Math.pow(transitionX, 2) + Math.pow(transitionY, 2))
           / Math.sqrt(100 * 100 + 500 * 500);
       while (Math.abs(angle) < 20) {
           angle = getRndInteger(-100, 100)
       }

       words[i].style.transform = 'rotate(' + angle + 'deg) translate(' + transitionX + 'pt, '
           + transitionY + 'vh) scale(' + scale + ')';
       words[i].style.opacity = '0';
    }
}

$welcome.addEventListener('click', function () {
    // welcomeDepart();
    $fileInput.click();
});
$uploadForm.addEventListener('click', function () {
    // welcomeDepart();
    $fileInput.click();
});

$fileInput.addEventListener('change', handleFileSelect,false);

function handleFileSelect(evt) {
    let files = evt.target.files;
    readFile(files[0]);
}

function dropHandler(ev) {
    $wrapper.classList.remove('is-drag-over');
    document.body.classList.remove('is-drag-over');

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
        for (let i = 0; i < ev.dataTransfer.items.length; i++) {
          // If dropped items aren't files, reject them
          if (ev.dataTransfer.items[i].kind === 'file') {
            let file = ev.dataTransfer.items[i].getAsFile();
            // console.log('... file[' + i + '].name = ' + file.name);

            readFile(file);
          }
        }
    }
}

function readFile(file) {
    if (file) {
      let r = new FileReader();
      r.onload = function(e) {
          let contents = e.target.result;
          welcomeDepart();
          // console.log(contents);
          parse(contents);
      };
      r.readAsText(file);
    } else {
      alert("Failed to load file");
    }
}

function parse(code) {
    let data = {
      code: code
    };

    let boundary = String(Math.random()).slice(2),
        boundaryMiddle = '--' + boundary + '\r\n',
        boundaryLast = '--' + boundary + '--\r\n';

    let body = ['\r\n'];
    for (let key in data) {
      // добавление поля
      body.push('Content-Disposition: form-data; name="' + key + '"\r\n\r\n' + data[key] + '\r\n');
    }

    body = body.join(boundaryMiddle) + boundaryLast;

    let xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://127.0.0.1:8000/lab1/parsing/', true);

    xhr.setRequestHeader('X-CSRFToken', Cookies.get('csrftoken'));
    xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    xhr.onreadystatechange = function() {
      if (this.readyState !== 4) return;

      let chain = JSON.parse(this.responseText);
      // console.log(chain);

      code = new Code(chain.chain, chain.tables);
      sessionStorage.setItem('chain', JSON.stringify(chain.chain));
      sessionStorage.setItem('tables', JSON.stringify(chain.tables));
    };

    xhr.send(body)
}

$wrapper.addEventListener('dragover', function() {
    $wrapper.classList.add('is-drag-over');
    document.body.classList.add('is-drag-over');
});
$wrapper.addEventListener('dragleave', function() {
    $wrapper.classList.remove('is-drag-over');
    document.body.classList.remove('is-drag-over');
});

function dragOverHandler(ev) {
    ev.preventDefault();
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function reflow(elt){
    // console.log(elt.offsetHeight);
    elt.offsetHeight;
}

// function animate(options) {
//
//   let start = performance.now();
//
//   requestAnimationFrame(function animate(time) {
//     // timeFraction от 0 до 1
//     let timeFraction = (time - start) / options.duration;
//     if (timeFraction > 1) timeFraction = 1;
//
//     // текущее состояние анимации
//     let progress = options.timing(timeFraction);
//
//     options.draw(progress);
//
//     if (timeFraction < 1) {
//       requestAnimationFrame(animate);
//     }
//
//   });
// }

function linear(progress) {
  return progress
}

// function reverse(progress) {
//   return 1 - progress
// }
//
// function reverseQuad(progress) {
//   return Math.pow(1 - progress, 0.2)
// }
//
// function easeInOut(progress) {
//     if (progress <= 0.5) { // первая половина анимации)
//         return timing(2 * progress) / 2;
//     } else { // вторая половина
//         return (2 - timing(2 * (1 - progress))) / 2;
//     }
// }
//
// function quad(progress) {
//   return Math.pow(progress, 0.9)
// }
//
// function circ(timeFraction) {
//   return 1 - Math.sin(Math.acos(timeFraction))
// }