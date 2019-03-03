var $wrapper = document.getElementById('wrapper');
var $welcome = document.getElementById('welcome');
var $welcomeWrapper = document.getElementById('welcome-wrapper');
var $uploadForm = document.getElementById('upload-form');
var $fileInput = document.getElementById('file-input');
var $cornersone = document.getElementById('cornersone');


class Code {
    constructor(chain, tables) {
        this.chain = chain;
        this.tables = tables;
        this.cursor = {
            x: 0,
            y: 0
        }
        this.selection = {
            x: 0,
            y: 0,
            length: 0
        }

        this.$breakLine = document.createElement('div');
        this.$breakLine.className = 'break-line';

        this.$indent = document.createElement('div');
        this.$indent.classList.add('token', 'indent');
        this.$indent.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;';

        this.$space = document.createElement('div');
        this.$space.classList.add('token', 'space');
        this.$space.innerHTML = '&nbsp;';

        this.lineOffset = 7;

        this.tokens = [[]];
        this.cornerstone = {
            'width': cornerstone.offsetWidth,
            'height': cornerstone.offsetHeight
        };

        if (this.chain && this.tables) {
            var $programWrapper = document.querySelector('#program-wrapper');
            $programWrapper.innerHTML = '';

            var tokenNumberInLine = 0;
            var varFlag = false,
                constFlag = false,
                thenFlag = false,
                beginFlag = false,
                endFlag = false,
                thenComboCounter = 0;

            var indent = 0;
            var numberOfLine = 0;

            for (var i = 0; i < this.chain.length; i++) {
                var $newToken = document.createElement('div');
                $newToken.classList.add('token', this.chain[i][3]);
                $newToken.innerText = this.chain[i][2];

                if (this.chain[i].length > 4) {
                    if (this.chain[i][4] == 'string') {
                        $newToken.innerText = '\'' + this.chain[i][2] + '\'';
                    }
                    $newToken.classList.add(this.chain[i][4]);
                }

                if (this.chain[i][2] == ':=') {
                    $newToken.classList.add('assignment');
                }

                if (this.chain[i][2] == 'else') {
                    $programWrapper.appendChild(this.$breakLine.cloneNode());
                    this.tokens.push([]);
                    numberOfLine++;
                    tokenNumberInLine = 0;
                    beginFlag = false;
                    endFlag = false;
                }

                if ((this.chain[i][2] == 'end') || (this.chain[i][2] == 'end.')
                    || (this.chain[i][2] == 'else')
                    || ((varFlag) && (this.chain[i][3] == 'service-word')
                        && (this.chain[i][2] != 'array') && (this.chain[i][2] != 'of')
                        && (this.chain[i][2] != 'integer') && (this.chain[i][2] != 'real')
                        && (this.chain[i][2] != 'string'))
                    || ((constFlag) && (this.chain[i][3] == 'service-word'))) {
                    indent--;
                    varFlag = false;
                    constFlag = false;
                }

                if (tokenNumberInLine == 0) {
                    for (var j = 0; j < indent; j++) {
                        $programWrapper.appendChild(this.$indent.cloneNode(true));
                        // this.tokens.push(this.$indent.cloneNode());
                    }
                }

                console.log(this.chain[i][2], this.chain[i][3], indent, numberOfLine);

                $programWrapper.appendChild($newToken);
                this.tokens[this.tokens.length-1].push($newToken);

                var transitionX = getRndInteger(20, 50);
                var transitionY = getRndInteger(-400, -1000) - (numberOfLine + this.lineOffset) * this.cornerstone.height;

                var angle1 = getRndInteger(-10, -20) * 0;
                // while (Math.abs(angle1) < 10) {
                //     angle1 = getRndInteger(-100, 100)
                // }

                var angle2 = getRndInteger(-180, 180);
                while (Math.abs(angle2) < 50) {
                    angle2 = getRndInteger(-360, 360)
                }
                $newToken.style.transform = 'rotate(' + angle1 + 'deg) translate(' + transitionX + 'vw, '
                    + transitionY + 'px) scale(0) rotate(' + angle2 + 'deg)';

                reflow($newToken);


                if ((this.chain[i][2] != '(') && (this.chain[i][2] != '[')
                    && (this.chain[i][2] != '+') && (this.chain[i][2] != '-')
                    && (this.chain[i][2] != '*') && (this.chain[i][2] != '/')
                    && (this.chain[i][2] != ';') && (this.chain[i][2] != 'begin')
                    && (this.chain[i][2] != 'var') && (this.chain[i][2] != 'const')
                    && (this.chain[i][2] != 'then') && (this.chain[i][2] != 'else')) {
                    if ((i + 1 < this.chain.length) && (this.chain[i + 1][2])) {
                        if ((this.chain[i + 1][2] != ';') && (this.chain[i + 1][2] != ':')
                            && (this.chain[i + 1][2] != ',') && (this.chain[i + 1][2] != ']')
                            && (this.chain[i + 1][2] != ')') && (this.chain[i + 1][2] != '+')
                            && (this.chain[i + 1][2] != '-') && (this.chain[i + 1][2] != '*')
                            && (this.chain[i + 1][2] != '/')) {
                            $programWrapper.appendChild(this.$space.cloneNode(true));
                            // this.tokens.push(this.$space.cloneNode());
                        }
                    }
                }

                tokenNumberInLine++;

                if (this.chain[i][2] == ';') {
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

                if ((this.chain[i][2] == 'var') || (this.chain[i][2] == 'begin')
                    || (this.chain[i][2] == 'then') || (this.chain[i][2] == 'else')
                    || (this.chain[i][2] == 'const')) {
                    $programWrapper.appendChild(this.$breakLine.cloneNode());
                    this.tokens.push([]);
                    numberOfLine++;
                    tokenNumberInLine = 0;
                    indent++;
                }

                if ((this.chain[i][2] == 'var')) {
                    varFlag = true;
                }

                if ((this.chain[i][2] == 'const')) {
                    constFlag = true;
                }

                if ((this.chain[i][2] == 'then') || (this.chain[i][2] == 'else')) {
                    thenFlag = true;
                    if (!beginFlag) {
                        thenComboCounter++;
                    }
                }

                if (this.chain[i][2] == 'begin') {
                    thenFlag = false;
                    beginFlag = true;
                }

                if (this.chain[i][2] == 'end') {
                    endFlag = true;
                }

                if ((this.chain[i][2] == ':') && (!varFlag)) {
                    $programWrapper.appendChild(this.$breakLine.cloneNode());
                    this.tokens.push([]);
                    numberOfLine++;
                    tokenNumberInLine = 0;
                }
            }

            $programWrapper.style.top = (window.innerHeight - 1.6 * this.cornerstone.height) + 'px';

            var that = this;
            setTimeout(function () {
                that.programOnset(that.tokens.length-1);
            }, 50);
        }
    }

    programOnset(lineIndex) {
        var that = this;
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
        }
    }
}
var code = new Code(null, null);


function welcomeDepart() {
    var words = document.getElementsByClassName('welcome-word');
    for (var i = 0; i < words.length; i++) {
       var angle = getRndInteger(-100, 100);
       var transitionX = getRndInteger(-100, 100);
       var transitionY = getRndInteger(-500, -50);
       var scale = Math.sqrt(Math.pow(transitionX, 2) + Math.pow(transitionY, 2))
           / Math.sqrt(100 * 100 + 500 * 500);
       while (Math.abs(angle) < 20) {
           angle = getRndInteger(-100, 100)
       }
       words[i].style.transform = 'rotate(' + angle + 'deg) translate(' + transitionX + 'pt, '
           + transitionY + 'vh) scale(' + scale + ')';
       words[i].style.opacity = 0;
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

$fileInput.addEventListener('change', hundleFileSelect,false)

function hundleFileSelect(evt) {
    var files = evt.target.files;
    readFile(files[0]);
}

function dropHandler(ev) {
    $wrapper.classList.remove('is-drag-over');
    document.body.classList.remove('is-drag-over');

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
        for (var i = 0; i < ev.dataTransfer.items.length; i++) {
          // If dropped items aren't files, reject them
          if (ev.dataTransfer.items[i].kind === 'file') {
            var file = ev.dataTransfer.items[i].getAsFile();
            // console.log('... file[' + i + '].name = ' + file.name);

            readFile(file);
          }
        }
    }
}

function readFile(file) {
    if (file) {
      var r = new FileReader();
      r.onload = function(e) {
          var contents = e.target.result;
          welcomeDepart();
          // console.log(contents);
          parse(contents);
      }
      r.readAsText(file);
    } else {
      alert("Failed to load file");
    }
}

function parse(code) {
    var data = {
      code: code
    };

    var boundary = String(Math.random()).slice(2);
    var boundaryMiddle = '--' + boundary + '\r\n';
    var boundaryLast = '--' + boundary + '--\r\n'

    var body = ['\r\n'];
    for (var key in data) {
      // добавление поля
      body.push('Content-Disposition: form-data; name="' + key + '"\r\n\r\n' + data[key] + '\r\n');
    }

    body = body.join(boundaryMiddle) + boundaryLast;

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://127.0.0.1:8000/lab1/parsing/', true);

    // xhr.setRequestHeader('Authorization', 'Token ' + Cookies.get('csrftoken'));
    xhr.setRequestHeader('X-CSRFToken', Cookies.get('csrftoken'));
    xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    xhr.onreadystatechange = function() {
      if (this.readyState != 4) return;

      var chain = JSON.parse(this.responseText);
      // console.log(chain);

      code = new Code(chain.chain, chain.tables);
    }

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
}

function animate(options) {

  var start = performance.now();

  requestAnimationFrame(function animate(time) {
    // timeFraction от 0 до 1
    var timeFraction = (time - start) / options.duration;
    if (timeFraction > 1) timeFraction = 1;

    // текущее состояние анимации
    var progress = options.timing(timeFraction)

    options.draw(progress);

    if (timeFraction < 1) {
      requestAnimationFrame(animate);
    }

  });
}

function linear(progress) {
  return progress
}

function reverse(progress) {
  return 1 - progress
}

function reverseQuad(progress) {
  return Math.pow(1 - progress, 0.2)
}

function easeInOut(progress) {
    if (progress <= 0.5) { // первая половина анимации)
        return timing(2 * progress) / 2;
    } else { // вторая половина
        return (2 - timing(2 * (1 - progress))) / 2;
    }
}

function quad(progress) {
  return Math.pow(progress, 0.9)
}

function circ(timeFraction) {
  return 1 - Math.sin(Math.acos(timeFraction))
}