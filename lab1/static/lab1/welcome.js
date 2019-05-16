const $wrapper = document.getElementById('wrapper'),
    $welcome = document.getElementById('welcome'),
    $welcomeWrapper = document.getElementById('welcome-wrapper'),
    $uploadForm = document.getElementById('upload-form'),
    $fileInput = document.getElementById('file-input'),
    $cornerstone = document.getElementById('cornerstone'),
    $programWrapper = document.getElementById('program-wrapper'),
    $tokensWrapper = document.getElementById('tokens-wrapper'),
    $tablesWrapper = document.getElementById('tables-wrapper'),
    $chainWrapper = document.getElementById('chain-wrapper'),
    $skipBtn = document.getElementById('skip-btn'),
    $mistakePopup = document.getElementById('mistake-popup'),
    $rpnWrapper = document.getElementById('rpn-wrapper');

class Code {

    // action methods
    constructor(chain, tables, mistakes, rpn) {
        this.mistakes = mistakes;
        this.rpn = rpn;
        this.skip = false;
        this.chain = chain;
        this.tables = tables;
        this.cursorPos = {
            x: 0,
            y: 0
        };

        this.lineOffset = 4;
        this.topOffset = 0;

        this.tokens = [[]];
        this.cornerstone = {
            'width': $cornerstone.offsetWidth - 0.2,
            'height': $cornerstone.offsetHeight
        };

        this.$cursor = document.createElement('div');
        this.$cursor.className = 'text-cursor';
        this.$cursor.setAttribute('id', 'text-editor');
        this.$cursor.style.height = this.cornerstone.height;

        this.selection = {
            x: 0,
            y: 0,
            width: 0
        };

        this.$selectionWrapper = document.createElement('div');
        this.$selectionWrapper.className = 'selection-wrapper';
        this.$selectionWrapper.style.height = this.cornerstone.height;
        this.$selectionWrapper.style.transitionDuration = '0s';

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

        this.$plug = $cornerstone.cloneNode(true);
        this.$plug.innerHTML = '&nbsp;';

        // this.$tables = [];
        this.$table = document.createElement('div');
        this.$table.className = 'table';

        this.$serviceWordsTable = null;
        this.$identifiersTable = null;
        this.$separatorsTable = null;
        this.$operationsTable = null;
        this.$constantsTable = null;

        $tablesWrapper.style.top = '-' + 3 * this.cornerstone.height + 'px';
        this.currentTokenNumber = 0;
    }

    getTokenType(sign) {
        switch (sign[0]) {
            case 'W':
                return 'service-word';
            case 'O':
                return 'operation';
            case 'C':
                return sign[4];
            case 'I':
                return 'identifier';
            case 'R':
                return 'separator';

            default:
                return '';
        }
    }

    renderTokens() {
        if (this.chain && this.tables) {
            $tokensWrapper.innerHTML = '';

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
                const tokensType = this.getTokenType(this.chain[i]);
                console.log(this.chain[i], tokensType);
                $newToken.classList.add('token', tokensType);
                $newToken.innerText = this.chain[i][2];

                if (this.chain[i].length > 4) {
                    if (this.chain[i][4] === 'string') {
                        $newToken.innerText = '\'' + this.chain[i][2] + '\'';
                    }
                    $newToken.classList.add(tokensType);
                }

                if (this.chain[i][2] === ':=') {
                    $newToken.classList.add('assignment');
                }

                if (this.chain[i][2] === 'else') {
                    const $newBreakLine = this.$breakLine.cloneNode();
                    $tokensWrapper.appendChild(this.$plug.cloneNode(true));
                    $tokensWrapper.appendChild($newBreakLine);
                    this.tokens[this.tokens.length-1].push($newBreakLine);

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
                    || ((constFlag) && (tokensType === 'service-word'))) {
                    indent--;
                    varFlag = false;
                    constFlag = false;
                }

                if (tokenNumberInLine === 0) {
                    for (let j = 0; j < indent; j++) {
                        const $newIndent = this.$indent.cloneNode(true);
                        $tokensWrapper.appendChild($newIndent);

                        this.tokens[this.tokens.length-1].push($newIndent);
                    }
                }

                // console.log(this.chain[i][2], this.chain[i][3], indent, numberOfLine);

                $tokensWrapper.appendChild($newToken);

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
                            && (this.chain[i + 1][2] !== '/') && (this.chain[i + 1][2] !== 'else')) {
                            const $newSpace = this.$space.cloneNode(true);
                            $tokensWrapper.appendChild($newSpace);
                            this.tokens[this.tokens.length-1].push($newSpace);
                        }
                    }
                }

                tokenNumberInLine++;

                if (this.chain[i][2] === ';') {
                    const $newBreakLine = this.$breakLine.cloneNode();
                    $tokensWrapper.appendChild(this.$plug.cloneNode(true));
                    $tokensWrapper.appendChild($newBreakLine);
                    this.tokens[this.tokens.length-1].push($newBreakLine);
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
                    const $newBreakLine = this.$breakLine.cloneNode();
                    $tokensWrapper.appendChild(this.$plug.cloneNode(true));
                    $tokensWrapper.appendChild($newBreakLine);
                    this.tokens[this.tokens.length-1].push($newBreakLine);
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
                    const $newBreakLine = this.$breakLine.cloneNode();
                    $tokensWrapper.appendChild(this.$plug.cloneNode(true));
                    $tokensWrapper.appendChild($newBreakLine);
                    this.tokens[this.tokens.length-1].push($newBreakLine);
                    this.tokens.push([]);

                    numberOfLine++;
                    tokenNumberInLine = 0;
                }
            }
        }

        console.log(this.tokens);

        if (document.contains(document.getElementById("text-cursor"))) {
            $programWrapper.removeChild(this.$cursor);
            $programWrapper.removeChild(this.$selectionWrapper);
        }

        $chainWrapper.innerHTML = '';
        $tablesWrapper.innerHTML = '';

        $programWrapper.style.top = (100 - (3.6 * this.cornerstone.height / window.innerHeight) * 100) + 'vh';
        $programWrapper.appendChild(this.$cursor);
        reflow(this.$cursor);

        $programWrapper.appendChild(this.$selectionWrapper);
        reflow(this.$selectionWrapper);

    //    Render chain
        for (let i = 0; i < this.chain.length; i++) {
            const $newUnit = document.createElement('div');
            const newClass = this.getTokenType(this.chain[i]);
            $newUnit.classList.add('token', newClass);
            $newUnit.setAttribute('id', 'unit-number-' + i);
            $newUnit.innerText = this.chain[i][0] + this.chain[i][1].toString();
            $chainWrapper.appendChild($newUnit);
        }

    //    Render tables
        if ('service_words' in this.tables) {
            const $serviceWordsTable = this.$table.cloneNode();
            for (let i = 0; i < this.tables.service_words.length; i++) {
                const $code = document.createElement('div');
                $code.className = 'code service-word';
                $code.setAttribute('id', this.tables.service_words[i] + '-code');
                $code.innerText = 'W' + i;

                const $token = document.createElement('div');
                $token.className = 'token service-word';
                $token.setAttribute('id', this.tables.service_words[i] + '-token');
                $token.innerText = this.tables.service_words[i];
                if (this.tables.service_words[i] === ':=') {
                    $token.style.color = 'black';
                }

                const $newItem = document.createElement('div');
                $newItem.className = 'item';
                $newItem.setAttribute('id', this.tables.service_words[i] + '-item');
                $newItem.appendChild($code);
                $newItem.appendChild($token);

                $serviceWordsTable.appendChild($newItem);
            }
            this.$serviceWordsTable = $serviceWordsTable;
            $tablesWrapper.appendChild(this.$serviceWordsTable);
        }

        if ('separators' in this.tables) {
            const $separatorsTable = this.$table.cloneNode();
            for (let i = 0; i < this.tables.separators.length; i++) {
                const $code = document.createElement('div');
                $code.className = 'code separator';
                $code.setAttribute('id', this.tables.separators[i] + '-code');
                $code.innerText = 'R' + i;

                const $token = document.createElement('div');
                $token.className = 'token separator';
                $token.setAttribute('id', this.tables.separators[i] + '-token');
                $token.innerText = this.tables.separators[i];

                const $newItem = document.createElement('div');
                $newItem.className = 'item';
                $newItem.setAttribute('id', this.tables.separators[i] + '-item');
                $newItem.appendChild($code);
                $newItem.appendChild($token);

                $separatorsTable.appendChild($newItem);
            }
            this.$separatorsTable = $separatorsTable;
            $tablesWrapper.appendChild(this.$separatorsTable);
        }

        if ('operations' in this.tables) {
            const $operationsTable = this.$table.cloneNode();
            for (let i = 0; i < this.tables.operations.length; i++) {
                const $code = document.createElement('div');
                $code.className = 'code operation';
                $code.setAttribute('id', this.tables.operations[i] + '-code');
                $code.innerText = 'O' + i;

                const $token = document.createElement('div');
                $token.className = 'token operation';
                $token.setAttribute('id', this.tables.operations[i] + '-token');
                $token.innerText = this.tables.operations[i];

                const $newItem = document.createElement('div');
                $newItem.className = 'item';
                $newItem.setAttribute('id', this.tables.operations[i] + '-item');
                $newItem.appendChild($code);
                $newItem.appendChild($token);

                $operationsTable.appendChild($newItem);
            }
            this.$operationsTable = $operationsTable;
            $tablesWrapper.appendChild(this.$operationsTable);
        }

        if ('identifiers' in this.tables) {
            const $identifiersTable = this.$table.cloneNode();
            for (let i = 0; i < this.tables.identifiers.length; i++) {
                const $code = document.createElement('div');
                $code.className = 'code identifier';
                $code.setAttribute('id', this.tables.identifiers[i].name + '-code');
                $code.innerText = 'I' + i;

                const $token = document.createElement('div');
                $token.className = 'token identifier';
                $token.setAttribute('id', this.tables.identifiers[i].name + '-token');
                $token.innerText = this.tables.identifiers[i].name;

                const $newItem = document.createElement('div');
                $newItem.className = 'item';
                $newItem.setAttribute('id', this.tables.identifiers[i].name + '-item');
                $newItem.appendChild($code);
                $newItem.appendChild($token);

                $identifiersTable.appendChild($newItem);
            }
            this.$identifiersTable = $identifiersTable;
            $tablesWrapper.appendChild(this.$identifiersTable);
        }

        if ('constants' in this.tables) {
            const $constantsTable = this.$table.cloneNode();
            for (let i = 0; i < this.tables.constants.length; i++) {
                const $code = document.createElement('div');
                $code.classList.add('code', this.tables.constants[i].type);
                $code.setAttribute('id', this.tables.constants[i].value.replace(' ', '_') + '-code');
                $code.innerText = 'C' + i;

                const $token = document.createElement('div');
                $token.classList.add('token', this.tables.constants[i].type);
                $token.setAttribute('id', this.tables.constants[i].value.replace(' ', '_') + '-token');
                $token.innerText = this.tables.constants[i].type === 'string' ? '\'' + this.tables.constants[i].value + '\'' : this.tables.constants[i].value;

                const $newItem = document.createElement('div');
                $newItem.className = 'item';
                $newItem.setAttribute('id', this.tables.constants[i].value.replace(' ', '_') + '-item');
                $newItem.appendChild($code);
                $newItem.appendChild($token);

                $constantsTable.appendChild($newItem);
            }
            this.$constantsTable = $constantsTable;
            $tablesWrapper.appendChild(this.$constantsTable);
        }
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
            // console.log(this.tokens);
            setTimeout(function() {
                that.setCursor(0, -7);
                setTimeout(function() {
                    let $321Node = that.appendNode('3.. 2.. 1..', 0, -7, function() {
                        that.setSelection(0, -7, '3.. 2.. 1..'.length, false, function() {
                            setTimeout(function() {
                                that.hideSelection();
                                $321Node.style.display = 'none';
                                that.moveCursor(0, 0, function() {
                                    that.parse(false, false, function () {
                                        that.moveCursor(((window.innerWidth - window.innerWidth * 0.14) / 2 / that.cornerstone.width) - 7, 0, function () {
                                            let $finalNode = that.appendNode('TTFN', ((window.innerWidth - window.innerWidth * 0.14) / 2 / that.cornerstone.width) - 7, 0, function () {
                                                that.$cursor.classList.add('non-animation');
                                                that.$cursor.style.opacity = '0';
                                            });
                                        });
                                    });
                                });
                            }, 300)
                        })
                    })
                }, 1200);
            }, 2400);
        }
    }

    skipProgramOnset() {
        this.tokens.forEach(function (line) {
            line.forEach(function(element) {
                element.style.transform = 'none';
            });
        });
    }

    showMistake() {
        $mistakePopup.classList.remove('hide');
        $skipBtn.classList.add('hide');
        this.tokens.forEach((line, lineIndex) => {
            line.forEach((element) => {
                // element.style.transform = 'none';
                element.style.transform = `translateY(${-this.cornerstone.height * (this.mistakes[0].line + 3)}px)`;
                if (lineIndex + 1 === this.mistakes[0].line && !element.classList.contains('indent')) {
                    element.style.background = '#ffb8b8';
                }
            });
        });
    }

    parse(lineIndex, tokenIndex, callback) {
        const that = this;

        lineIndex = lineIndex ? lineIndex : 0;
        tokenIndex = tokenIndex ? tokenIndex : 0;

        const token = this.tokens[lineIndex][tokenIndex];
        // console.log(token);
        if (!token.classList.contains('break-line')) {
            if (!token.classList.contains('space') && !token.classList.contains('indent')) {
                this.setSelectionByOne(0, 0, token.innerText.length, true, function () {
                    that.hideSelection();
                    that.setCursor(0, 0);
                    that.hideToken(token, function () {
                        let delay = {min: 200, max: 400}; // delay before line up

                        if (nextToken()) {
                            if (nextToken().className.includes('break-line')) {
                                delay = {min: 0, max: 0}
                            }
                        } else {
                            that.out();
                            return;
                        }

                        that.moveCursor(0, -2, function() {
                            that.pasteToken(token, 0, -2, function() {
                                setTimeout(function() {
                                    that.hideSelection(false);
                                    that.moveCursor(0, 0);

                                    let table = that.$serviceWordsTable;
                                    // console.log('CLASS', token.classList);
                                    if (token.classList.contains('identifier')) {
                                        table = that.$identifiersTable;
                                    }
                                    if (token.classList.contains('separator')) {
                                        table = that.$separatorsTable;
                                    }
                                    if (token.classList.contains('operation')) {
                                        table = that.$operationsTable;
                                    }
                                    if (token.classList.contains('integer') || token.classList.contains('real') || token.classList.contains('string')) {
                                        table = that.$constantsTable;
                                    }

                                    that.hitTableFor(table, token, function() {
                                        that.currentTokenNumber++;
                                        parseNext(delay);
                                    });
                                }, getRndInteger(80, 120));
                            })
                        })
                    })
                })
            } else {
                that.hideToken(token, function () {
                    let delay = {min: 200, max: 400};

                    if (nextToken()) {
                        if (nextToken().className.includes('break-line')) {
                            delay = {min: 0, max: 0}
                        }
                    } else {
                        that.out();
                        return;
                    }

                    parseNext(delay);
                });
            }
        } else {
            // console.log('line up');

            this.topOffset -= this.cornerstone.height;
            $tokensWrapper.style.transform = 'translateY(' + that.topOffset + 'px)';

            parseNext({min: 90, max: 120});
            // parseNext({min: 50, max: 50});
        }

        function parseNext(delay) {
            if (!that.skip) {
                setTimeout(function () {
                    console.log(tokenIndex + 1, '>=', that.tokens[lineIndex].length, '&&', lineIndex + 1, '>=', that.tokens.length, '&& functuion ===', typeof callback);
                    if (tokenIndex + 1 >= that.tokens[lineIndex].length) {
                        if (lineIndex + 1 >= that.tokens.length) {
                            if (typeof callback === 'function') {
                                console.log('FINAL!');
                                callback();
                            }
                        } else {
                            that.parse(lineIndex + 1, 0, callback);
                        }
                    } else {
                        that.parse(lineIndex, tokenIndex + 1, callback);
                    }
                }, getRndInteger(delay.min, delay.max));
            }
        }
        function nextToken() {
            if (!that.skip) {
                if (tokenIndex + 1 >= that.tokens[lineIndex].length) {
                    if (lineIndex + 1 >= that.tokens.length) {
                        if (typeof callback === 'function') {
                            return null; // end of program
                        }
                    } else {
                        return null; // end of line
                    }
                } else {
                    return that.tokens[lineIndex][tokenIndex + 1];
                }
            }
            return false;
        }
    }

    out() {
        console.log('hi!');
        $programWrapper.style.transform = 'translateY(300px)';

        this.chain.forEach((elem, index) => {
            setTimeout(() => {
                const $token = document.getElementById(`unit-number-${index}`);
                $token.style.opacity = '1';
                $token.style.display = 'inline-block';
                $token.style.transform = 'scale(0.7)';
            }, 1);
        });

        $rpnWrapper.innerText = this.rpn;
        $rpnWrapper.style.opacity = '1';
    }

    // practical methods

    hitTableFor($table, $token, callback) {
        const that = this;
        let coef = getRndInteger(0, 100);
        while (coef > 20 && coef < 80) {
            coef = getRndInteger(0, 100);
        }
        coef = coef / 100;

        const duration = 400;
        let tokenText = $token.innerText;
        if ($token.classList.contains('string')) {
            tokenText = tokenText.replace(' ', '_').substr(1).slice(0, -1);
        }
        document.getElementById(tokenText + '-item').classList.add('current');
        $table.style.transition = 'all ' + duration + 'ms ease-in-out';
        $table.style.opacity = '1';
        $table.style.left = -document.getElementById(tokenText + '-token').offsetLeft + 'px';
        const hitDuration = coef * duration < 100 ? 100 : coef * duration;

        setTimeout(function() {
            const $tokenCode = document.getElementById(tokenText + '-code');
            const $appropriateUnit = document.getElementById('unit-number-' + that.currentTokenNumber);
            const tokenCodePos = getPosition($tokenCode);
            const appropriateUnitPos = getPosition($appropriateUnit);
            const xDist = tokenCodePos.x - appropriateUnitPos.x;
            const yDist = tokenCodePos.y - appropriateUnitPos.y;

            $appropriateUnit.style.transition = 'none';
            $appropriateUnit.style.transform = 'translate(' + xDist + 'px, ' + yDist + 'px)'; // scale(1.5238095238095237)';
            $appropriateUnit.style.opacity = '1';
            $tokenCode.style.transition = 'none';
            $tokenCode.style.opacity = '0';

            $appropriateUnit.offsetHeight;

            $appropriateUnit.style.transition = 'all ' + hitDuration + 'ms ease-in';
            $appropriateUnit.style.transform = 'translate(' + xDist + 'px, ' + (yDist + that.cornerstone.height) + 'px)'; // scale(1.5238095238095237)';

            $appropriateUnit.offsetHeight;

            $table.style.transition = 'all ' + hitDuration + 'ms ease-in';
            $table.style.top = that.cornerstone.height + 'px';

            const codeDuration = 500;
            setTimeout(function() {
                $appropriateUnit.style.transition = 'all ' + codeDuration + 'ms';
                $appropriateUnit.style.transitionTimingFunction = 'ease-out';
                $appropriateUnit.style.transform = 'translate(' + (xDist - 40) + 'px, ' + (yDist + (1 - coef) * that.cornerstone.height * 3.5) + 'px) scale(1.5) rotate(' + -(1 - coef) * 100 + 'deg)';

                $appropriateUnit.offsetHeight;

                setTimeout(function() {
                    $appropriateUnit.style.transition = 'all ' + codeDuration + 'ms';
                    $appropriateUnit.style.transitionTimingFunction = 'ease-out';
                    $appropriateUnit.style.transform = 'scale(0.7)';
                }, codeDuration);
            }, hitDuration);

            setTimeout(function() {
                $table.style.transition = 'all 100ms ease-in';
                $table.style.opacity = '0';

                $token.style.transition = 'all 100ms ease-in';
                $token.style.opacity = '0';

                setTimeout(function() {
                    $table.style.top = '0';
                    $tokenCode.style.opacity = '1';
                    document.getElementById(tokenText + '-item').classList.remove('current');
                }, 100);

                if (typeof callback === 'function') {
                    callback();
                }
            }, duration + 10);
        }, duration + 10);
    }

    hideToken(token, callback) {
        const duration = 100;
        token.style.transitionDuration = duration + 'ms';
        token.style.transitionTimingFunction = 'ease-in-out';
        token.style.transitionProperty = 'none';
        token.offsetHeight;

        animate({
            duration: duration,
            timing: linear,
            draw: function(progress) {
                token.style.width = token.offsetWidth * (1 - progress) + 1 + 'px';
                if (progress === 1) {
                    token.style.display = 'none';
                    $tokensWrapper.removeChild(token);
                }
            }
        });
        // token.style.background = '#ffcce4';


        if (typeof callback === 'function') {
            setTimeout(function() {
                callback();
            }, duration);
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

        // if (text === ';)') {
        //     $newNode.style.fontFamily = '-apple-system, arial';
        //     $newNode.style.overflow = 'visible';
        // }

        $programWrapper.appendChild($newNode);
        reflow($newNode);

        this.setCursor(x, y);

        typing(0);

        function typing(duration) {
            setTimeout(function() {
                that.$cursor.classList.add('non-animation');
                if (that.cursorPos.x < x + text.length) {
                    that.setCursor(that.cursorPos.x + 1, y);
                    $newNode.style.width = (that.cursorPos.x - x) * that.cornerstone.width;

                    let delay = getRndInteger(200, 300);
                    if (text[that.cursorPos.x - x - 1] === text[that.cursorPos.x - x]) {
                        delay = getRndInteger(100, 150)
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

    pasteToken(token, x, y, callback) {
        const that = this;
        const duration = 100;
        token.style.position = 'absolute';
        token.style.left = x * this.cornerstone.width + 'px';
        token.style.top = y * this.cornerstone.height + 'px';
        token.style.display = 'block';
        token.style.width = 'auto';
        token.style.opacity = '0';

        $programWrapper.appendChild(token);
        token.offsetHeight;

        const tokenDefaultWidth = token.offsetWidth;
        token.style.width = '0';
        token.style.opacity = '1';
        token.offsetHeight;

        // console.log(tokenDefaultWidth);

        // this.setCursor(x + token.innerHTML.length, y);
        // this.setSelection(x, y, token.innerHTML.length, true);

        this.$cursor.classList.add('non-animation');
        this.$cursor.classList.add('non-transition');
        this.$selectionWrapper.classList.add('non-transition');

        this.$selectionWrapper.style.left = x * this.cornerstone.width + 'px';
        this.$selectionWrapper.style.top = y * this.cornerstone.height + 'px';
        animate({
            duration: duration,
            timing: linear,
            draw: function(progress) {
                token.style.width = tokenDefaultWidth * progress + 'px';
                that.$cursor.style.left = tokenDefaultWidth * progress + 'px';
                that.$selectionWrapper.style.width = tokenDefaultWidth * progress + 'px';
            }
        });

        setTimeout(function() {
            if (typeof callback === 'function') {
                that.$cursor.classList.remove('non-animation');
                that.$cursor.classList.remove('non-transition');
                that.$selectionWrapper.classList.remove('non-transition');
                callback()
            }
        }, duration)
    }

    setSelection(x, y, width, leftToRight, callback) {
        // console.log('setSelection', x, y, width, leftToRight);
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

        reflow(this.$selectionWrapper);

        if (typeof callback == "function") {
            setTimeout(function() {
                callback()
            }, duration);
        }
    }

    setSelectionByOne(x, y, width, leftToRight, callback) {
        this.$cursor.classList.add('non-animation');
        this.setSelection(x, y, 0, true);

        this.$selectionWrapper.style.transitionDuration = '0.1s';

        if (this.selection.width < width) {
            const that = this;
            this.changeSelectionWidthTo(width, leftToRight, function() {
                that.$cursor.classList.remove('non-animation');
                that.$selectionWrapper.style.transitionDuration = '0s';
                if (typeof callback === 'function') {
                    callback();
                }
            });
        }
    }

    changeSelectionWidthTo(width, rightArrowed, callback) {
        if (this.selection.width < width) {
            if (rightArrowed) {
                this.selection.width++;
                this.setCursor(this.cursorPos.x + 1, this.cursorPos.y);
                this.$selectionWrapper.style.width = this.selection.width * this.cornerstone.width + 'px';
            } else {
                this.selection.width++;
                this.selection.x--;
                this.$selectionWrapper.style.left = this.selection.x * this.cornerstone.width + 'px';
                this.$selectionWrapper.style.width = this.selection.width * this.cornerstone.width + 'px';
                // this.moveCursor(this.cursorPos.x - 1, this.cursorPos.y);
            }

            const that = this;
            setTimeout(function() {
                that.changeSelectionWidthTo(width, rightArrowed, callback);
            }, getRndInteger(100, 180));
        } else {
            if (typeof callback === 'function') {
                callback();
            }
        }
    }

    hideSelection(smooth, rightDirected) {
        if (smooth) {

        } else {
            this.setSelection(this.cursorPos.x, this.cursorPos.y, 0, true);
        }
    }

    setCursor(x, y) {
        this.cursorPos = {
            x: x,
            y: y
        };

        // this.$cursor.style.transitionDuration = '100ms';
        this.$cursor.style.left = this.cursorPos.x * this.cornerstone.width + 'px';
        this.$cursor.style.top = this.cursorPos.y * this.cornerstone.height + 'px';
        this.$cursor.style.display = 'block';
    }

    moveCursor(x, y, callback) {
        if ((this.cursorPos.x !== x) || (this.cursorPos.y !== y)) {
            this.$cursor.classList.add('non-animation');
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
            }, getRndInteger(50, 150));
        } else {
            this.$cursor.classList.remove('non-animation');
            if (typeof callback == 'function') {
                callback();
            }
        }
    }
}

let code;

$welcomeWrapper.classList.add('hide');
if (sessionStorage.getItem('chain') != null) {
    const chain = JSON.parse(sessionStorage.getItem('chain'));
    console.log(chain);
    code = new Code(
        chain.chain,
        chain.tables,
        chain.mistakes,
        chain.rpn,
    );
    code.renderTokens();

    if (chain.mistakes.length) {
        code.showMistake();
    } else {
        code.skipProgramOnset();
        code.setCursor(0, 0);

        setTimeout(function() {
            code.parse();
        }, 1000);
    }
} else {
    $welcomeWrapper.classList.remove('hide');
}

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

function parse(text) {
    let data = {
      code: text
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
        console.log(chain);

        // sessionStorage.removeItem('chain');
        // sessionStorage.removeItem('tables');

        sessionStorage.setItem('chain', JSON.stringify(chain));

        code = new Code(
            chain.chain,
            chain.tables,
            chain.mistakes,
            chain.rpn,
        );
        code.renderTokens();

        if (chain.mistakes.length) {
            code.showMistake();
        } else {
            code.skipProgramOnset();
            code.setCursor(0, 0);

            setTimeout(function() {
                code.parse();
            }, 1000);
        }
        // code.programOnset(code.tokens.length-1);
    };

    xhr.send(body)
}
$skipBtn.addEventListener('click', () => {
    code.skip = true;
    code.out();
    if ($skipBtn.innerText == 'ОПЗ') {

        $skipBtn.innerText = 'Basic';
    }

});
// let chain = '{"chain": [["W", 0, "program", 1], ["I", 0, "fdadf", 1], ["R", 4, ";", 1], ["W", 1, "var", 2], ["I", 1, "a", 3], ["R", 3, ":", 3], ["W", 3, "integer", 3], ["R", 4, ";", 3], ["I", 2, "b", 4], ["R", 3, ":", 4], ["W", 4, "real", 4], ["R", 4, ";", 4], ["I", 3, "s", 5], ["R", 3, ":", 5], ["W", 5, "string", 5], ["R", 4, ";", 5], ["I", 4, "arr", 6], ["R", 3, ":", 6], ["W", 7, "array", 6], ["R", 7, "[", 6], ["C", 0, "1", 6], ["R", 2, "..", 6], ["C", 1, "10", 6], ["R", 8, "]", 6], ["W", 8, "of", 6], ["W", 3, "integer", 6], ["R", 4, ";", 6], ["W", 9, "procedure", 8], ["I", 5, "procedure_one", 8], ["R", 5, "(", 8], ["I", 6, "parametr1", 8], ["R", 3, ":", 8], ["W", 3, "integer", 8], ["R", 6, ")", 8], ["R", 4, ";", 8], ["W", 1, "var", 9], ["I", 7, "i", 9], ["R", 3, ":", 9], ["W", 3, "integer", 9], ["R", 4, ";", 9], ["W", 11, "begin", 10], ["I", 7, "i", 11], ["W", 12, ":=", 11], ["C", 2, "0", 11], ["R", 4, ";", 11], ["W", 20, "while", 12], ["I", 7, "i", 12], ["O", 5, "<", 12], ["C", 1, "10", 12], ["I", 8, "do", 12], ["I", 7, "i", 13], ["W", 12, ":=", 13], ["I", 7, "i", 13], ["O", 0, "+", 13], ["C", 0, "1", 13], ["R", 4, ";", 13], ["W", 17, "end", 14], ["R", 4, ";", 14], ["W", 10, "function", 16], ["I", 9, "fun", 16], ["R", 5, "(", 16], ["I", 10, "k1", 16], ["R", 3, ":", 16], ["W", 3, "integer", 16], ["R", 4, ";", 16], ["I", 11, "k2", 16], ["R", 3, ":", 16], ["W", 4, "real", 16], ["R", 4, ";", 16], ["I", 12, "parametr2", 16], ["R", 3, ":", 16], ["W", 5, "string", 16], ["R", 6, ")", 16], ["R", 3, ":", 16], ["W", 3, "integer", 16], ["R", 4, ";", 16], ["W", 1, "var", 17], ["I", 13, "str", 17], ["R", 3, ":", 17], ["W", 5, "string", 17], ["R", 4, ";", 17], ["W", 11, "begin", 18], ["W", 14, "if", 19], ["I", 10, "k1", 19], ["O", 6, ">", 19], ["I", 11, "k2", 19], ["W", 15, "then", 19], ["I", 13, "str", 20], ["W", 12, ":=", 20], ["C", 3, "k1 more then k2", 20], ["W", 16, "else", 21], ["I", 13, "str", 22], ["W", 12, ":=", 22], ["C", 4, "k1 less or eq k2", 22], ["R", 4, ";", 22], ["W", 19, "return", 23], ["I", 13, "str", 23], ["R", 4, ";", 23], ["W", 17, "end", 24], ["R", 4, ";", 24], ["W", 11, "begin", 26], ["I", 1, "a", 27], ["W", 12, ":=", 27], ["C", 1, "10", 27], ["R", 4, ";", 27], ["I", 2, "b", 28], ["W", 12, ":=", 28], ["C", 5, "5.25e5", 28], ["R", 4, ";", 28], ["I", 3, "s", 29], ["W", 12, ":=", 29], ["I", 9, "fun", 29], ["R", 5, "(", 29], ["I", 1, "a", 29], ["R", 1, ",", 29], ["I", 2, "b", 29], ["R", 1, ",", 29], ["I", 3, "s", 29], ["R", 6, ")", 29], ["R", 4, ";", 29], ["I", 5, "procedure_one", 30], ["R", 5, "(", 30], ["C", 1, "10", 30], ["R", 6, ")", 30], ["R", 4, ";", 30], ["W", 20, "while", 31], ["I", 1, "a", 31], ["O", 5, "<", 31], ["C", 6, "150", 31], ["I", 8, "do", 31], ["I", 1, "a", 32], ["W", 12, ":=", 32], ["I", 1, "a", 32], ["O", 2, "*", 32], ["C", 1, "10", 32], ["R", 4, ";", 32], ["I", 4, "arr", 33], ["R", 7, "[", 33], ["C", 0, "1", 33], ["R", 8, "]", 33], ["W", 12, ":=", 33], ["C", 1, "10", 33], ["R", 4, ";", 33], ["I", 4, "arr", 34], ["R", 7, "[", 34], ["C", 7, "2", 34], ["R", 8, "]", 34], ["W", 12, ":=", 34], ["C", 8, "20", 34], ["O", 2, "*", 34], ["I", 1, "a", 34], ["R", 4, ";", 34], ["W", 18, "end.", 36]], "tables": {"service_words": ["program", "var", "const", "integer", "real", "string", "label", "array", "of", "procedure", "function", "begin", ":=", "goto", "if", "then", "else", "end", "end.", "return", "while"], "operations": ["+", "-", "*", "/", "^", "<", ">", "=", "<>", "<=", ">="], "separators": [" ", ",", "..", ":", ";", "(", ")", "[", "]", "{", "}", "\'"], "constants": [{"type": "integer", "value": "1"}, {"type": "integer", "value": "10"}, {"type": "integer", "value": "0"}, {"type": "string", "value": "k1 more then k2"}, {"type": "string", "value": "k1 less or eq k2"}, {"type": "real", "value": "5.25e5"}, {"type": "integer", "value": "150"}, {"type": "integer", "value": "2"}, {"type": "integer", "value": "20"}], "identifiers": [{"type": "program", "name": "fdadf", "number_of_procedure": 0, "level_of_procedure": 0, "number_in_procedure": 0}, {"type": "integer", "name": "a", "number_of_procedure": 0, "level_of_procedure": 0, "number_in_procedure": 0}, {"type": "real", "name": "b", "number_of_procedure": 0, "level_of_procedure": 0, "number_in_procedure": 0}, {"type": "string", "name": "s", "number_of_procedure": 0, "level_of_procedure": 0, "number_in_procedure": 0}, {"type": "integer_array", "name": "arr", "number_of_procedure": 0, "level_of_procedure": 0, "number_in_procedure": 0}, {"type": "procedure", "name": "procedure_one", "number_of_procedure": 0, "level_of_procedure": 0, "number_in_procedure": 0}, {"type": "identifier", "name": "parametr1", "number_of_procedure": 0, "level_of_procedure": 0, "number_in_procedure": 0}, {"type": "integer", "name": "i", "number_of_procedure": 0, "level_of_procedure": 0, "number_in_procedure": 0}, {"type": "identifier", "name": "do", "number_of_procedure": 0, "level_of_procedure": 0, "number_in_procedure": 0}, {"type": "function", "name": "fun", "number_of_procedure": 0, "level_of_procedure": 0, "number_in_procedure": 0}, {"type": "identifier", "name": "k1", "number_of_procedure": 0, "level_of_procedure": 0, "number_in_procedure": 0}, {"type": "identifier", "name": "k2", "number_of_procedure": 0, "level_of_procedure": 0, "number_in_procedure": 0}, {"type": "identifier", "name": "parametr2", "number_of_procedure": 0, "level_of_procedure": 0, "number_in_procedure": 0}, {"type": "string", "name": "str", "number_of_procedure": 0, "level_of_procedure": 0, "number_in_procedure": 0}]}}';
// sessionStorage.setItem('chain', JSON.stringify(chain.chain));
// sessionStorage.setItem('tables', JSON.stringify(chain.tables));

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

function getPosition(element) {
    let xPosition = 0;
    let yPosition = 0;

    while(element) {
        xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
        yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
        element = element.offsetParent;
    }

    return { x: xPosition, y: yPosition };
}

function reflow(elt){
    // console.log(elt.offsetHeight);
    elt.offsetHeight;
}

function animate(options) {

  let start = performance.now();

  requestAnimationFrame(function animate(time) {
    // timeFraction от 0 до 1
    let timeFraction = (time - start) / options.duration;
    if (timeFraction > 1) timeFraction = 1;

    // текущее состояние анимации
    let progress = options.timing(timeFraction);

    options.draw(progress);

    if (timeFraction < 1) {
      requestAnimationFrame(animate);
    }

  });
}

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
function easeInOut(progress) {
    if (progress <= 0.5) { // первая половина анимации)
        return timing(2 * progress) / 2;
    } else { // вторая половина
        return (2 - timing(2 * (1 - progress))) / 2;
    }
}
//
function quad(progress) {
  return Math.pow(progress, 2)
}
function antiquad(progress) {
  return Math.pow(progress, 0.5)
}
//
// function circ(timeFraction) {
//   return 1 - Math.sin(Math.acos(timeFraction))
// }

/*--------------Library code----------------*/
/**
 * BezierEasing - use bezier curve for transition easing function
 * by Gaëtan Renaudeau 2014 – MIT License
 *
 * Credits: is based on Firefox's nsSMILKeySpline.cpp
 * Usage:
 * var spline = BezierEasing(0.25, 0.1, 0.25, 1.0)
 * spline(x) => returns the easing value | x must be in [0, 1] range
 *
 */
(function (definition) {
  if (typeof exports === "object") {
    module.exports = definition();
  } else if (typeof define === 'function' && define.amd) {
    define([], definition);
  } else {
    window.BezierEasing = definition();
  }
}(function () {
  var global = this;

  // These values are established by empiricism with tests (tradeoff: performance VS precision)
  var NEWTON_ITERATIONS = 4;
  var NEWTON_MIN_SLOPE = 0.001;
  var SUBDIVISION_PRECISION = 0.0000001;
  var SUBDIVISION_MAX_ITERATIONS = 10;

  var kSplineTableSize = 11;
  var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

  var float32ArraySupported = 'Float32Array' in global;

  function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
  function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
  function C (aA1)      { return 3.0 * aA1; }

  // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
  function calcBezier (aT, aA1, aA2) {
    return ((A(aA1, aA2)*aT + B(aA1, aA2))*aT + C(aA1))*aT;
  }

  // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
  function getSlope (aT, aA1, aA2) {
    return 3.0 * A(aA1, aA2)*aT*aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
  }

  function binarySubdivide (aX, aA, aB) {
    var currentX, currentT, i = 0;
    do {
      currentT = aA + (aB - aA) / 2.0;
      currentX = calcBezier(currentT, mX1, mX2) - aX;
      if (currentX > 0.0) {
        aB = currentT;
      } else {
        aA = currentT;
      }
    } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
    return currentT;
  }

  function BezierEasing (mX1, mY1, mX2, mY2) {
    // Validate arguments
    if (arguments.length !== 4) {
      throw new Error("BezierEasing requires 4 arguments.");
    }
    for (var i=0; i<4; ++i) {
      if (typeof arguments[i] !== "number" || isNaN(arguments[i]) || !isFinite(arguments[i])) {
        throw new Error("BezierEasing arguments should be integers.");
      }
    }
    if (mX1 < 0 || mX1 > 1 || mX2 < 0 || mX2 > 1) {
      throw new Error("BezierEasing x values must be in [0, 1] range.");
    }

    var mSampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);

    function newtonRaphsonIterate (aX, aGuessT) {
      for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
        var currentSlope = getSlope(aGuessT, mX1, mX2);
        if (currentSlope === 0.0) return aGuessT;
        var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
        aGuessT -= currentX / currentSlope;
      }
      return aGuessT;
    }

    function calcSampleValues () {
      for (var i = 0; i < kSplineTableSize; ++i) {
        mSampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
      }
    }

    function getTForX (aX) {
      var intervalStart = 0.0;
      var currentSample = 1;
      var lastSample = kSplineTableSize - 1;

      for (; currentSample != lastSample && mSampleValues[currentSample] <= aX; ++currentSample) {
        intervalStart += kSampleStepSize;
      }
      --currentSample;

      // Interpolate to provide an initial guess for t
      var dist = (aX - mSampleValues[currentSample]) / (mSampleValues[currentSample+1] - mSampleValues[currentSample]);
      var guessForT = intervalStart + dist * kSampleStepSize;

      var initialSlope = getSlope(guessForT, mX1, mX2);
      if (initialSlope >= NEWTON_MIN_SLOPE) {
        return newtonRaphsonIterate(aX, guessForT);
      } else if (initialSlope === 0.0) {
        return guessForT;
      } else {
        return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize);
      }
    }

    var _precomputed = false;
    function precompute() {
      _precomputed = true;
      if (mX1 != mY1 || mX2 != mY2)
        calcSampleValues();
    }

    var f = function (aX) {
      if (!_precomputed) precompute();
      if (mX1 === mY1 && mX2 === mY2) return aX; // linear
      // Because JavaScript number are imprecise, we should guarantee the extremes are right.
      if (aX === 0) return 0;
      if (aX === 1) return 1;
      return calcBezier(getTForX(aX), mY1, mY2);
    };

    f.getControlPoints = function() { return [{ x: mX1, y: mY1 }, { x: mX2, y: mY2 }]; };

    var args = [mX1, mY1, mX2, mY2];
    var str = "BezierEasing("+args+")";
    f.toString = function () { return str; };

    var css = "cubic-bezier("+args+")";
    f.toCSS = function () { return css; };

    return f;
  }

  // CSS mapping
  BezierEasing.css = {
    "ease":        BezierEasing(0.25, 0.1, 0.25, 1.0),
    "linear":      BezierEasing(0.00, 0.0, 1.00, 1.0),
    "ease-in":     BezierEasing(0.42, 0.0, 1.00, 1.0),
    "ease-out":    BezierEasing(0.00, 0.0, 0.58, 1.0),
    "ease-in-out": BezierEasing(0.42, 0.0, 0.58, 1.0)
  };

  return BezierEasing;

}));