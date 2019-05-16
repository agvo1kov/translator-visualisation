from django.shortcuts import render

import re
import json

# Create your views here.

service_words = ['program', 'var', 'const', 'integer', 'real', 'string', 'label',
                 'array', 'of', 'procedure', 'function',
                 'begin', ':=', 'goto', 'if', 'then', 'else', 'end', 'end.', 'return', 'while', 'do']
operations = ['+', '-', '*', '/', '^', '<', '>', '=', '<>', '<=', '>=']
separators = [' ', ',', '..', ':', ';', '(', ')', '[', ']', '{', '}', '\'']
constants = []
identifiers = []
mistakes = []
tokens_chain = []

def scan():
    global tokens_chain, token_index, nxtsymb, cursymb
    token_index += 1
    if token_index < len(tokens_chain):
        cursymb = nxtsymb
        nxtsymb = tokens_chain[token_index]
        print(nxtsymb)
def antiscan():
    global tokens_chain, token_index, nxtsymb
    token_index -= 1
    if token_index >= 0:
        nxtsymb = tokens_chain[token_index]
        print(nxtsymb)
def error(text):
    global cursymb, mistakes
    mistakes.append({
        'text': text,
        'line': cursymb[3]
    })
    # print(Fore.RED + 'Fatal:', Fore.BLACK + text, Style.RESET_ALL + Fore.WHITE + 'at line',
    #       Style.RESET_ALL + str(cursymb[3]))
def check(response):
    if response:
        error(response)
        return False
    else:
        return True
def argument():
    global nxtsymb
    # print(Fore.GREEN + 'argument' + Style.RESET_ALL)

    if nxtsymb[0] not in ['I', 'C']:
        return 'constant or identifier expected'
    scan()
    if nxtsymb[2] in ['[', '(']:
        scan()
        if not (check(expression())):
            return 'invalid expression'
        scan()
        while nxtsymb[2] == ',':
            scan()
            if not (check(expression())):
                return 'invalid expression'
            scan()
        if nxtsymb[2] not in [']', ')']:
            return 'expected \']\' or \')\''
    else:
        antiscan()
    # print(Fore.BLUE + 'Argument:' + Style.RESET_ALL, nxtsymb[2])
    return ''
def factor():
    global nxtsymb
    # print(Fore.GREEN + 'factor' + Style.RESET_ALL)

    if nxtsymb[2] == '(':
        scan()
        if not check(expression()):
            return 'expression expected'
        scan()
        if nxtsymb[2] != ')':
            return '")" expected'
    else:
        if not check(argument()):
            return 'constant or identifier expected'
    #         print('heh')
    return ''
def term():
    global nxtsymb
    # print(Fore.GREEN + 'term' + Style.RESET_ALL)

    if not check(factor()):
        return 'factor expected'
    #     print(Fore.BLUE + 'Factor:' + Style.RESET_ALL, nxtsymb[2])
    scan()
    while nxtsymb[2] in ['*', '/', '^']:
        scan()
        if not check(factor()):
            return 'factor expected'
        #         print(Fore.BLUE + 'Factor:' + Style.RESET_ALL, nxtsymb[2])
        scan()
    else:
        antiscan()
        pass
    #         print('End of factors')

    return ''
def expression():
    # print(Fore.GREEN + 'expression' + Style.RESET_ALL)
    global nxtsymb

    #     print('Terms:')
    if not check(term()):
        return 'term expected'
    #     print(Fore.BLUE + 'Term:' + Style.RESET_ALL, nxtsymb[2])
    scan()
    while nxtsymb[2] in ['+', '-']:
        scan()
        if not check(term()):
            return 'term expected'
        #         print(Fore.BLUE + 'Term:' + Style.RESET_ALL, nxtsymb[2])
        scan()
    else:
        antiscan()
        pass

    return ''
def assignment():
    global nxtsymb
    # print(Fore.GREEN + 'assignment' + Style.RESET_ALL)

    if nxtsymb[2] != ':=':
        return '":=" expected'
    scan()
    if not check(expression()):
        return 'invalid expression'
    # print(Fore.GREEN + 'expression checked' + Style.RESET_ALL)
    return ''
def condition():
    global nxtsymb
    # print(Fore.GREEN + 'condition' + Style.RESET_ALL)

    if not check(expression()):
        return 'expression expected'
    scan()
    if nxtsymb[2] not in ['=', '>', '<', '>=', '<=', '<>']:
        return 'comparasion operation'
    scan()
    if not check(expression()):
        return 'expression expected'
    return ''
def operator_and_return():
    global nxtsymb
    # print(Fore.GREEN + 'operator' + Style.RESET_ALL)

    if nxtsymb[2] == ';':
        pass
    elif nxtsymb[0] == 'I':
        scan()
        if nxtsymb[2] == ':':
            return ''
        if nxtsymb[2] == '[':
            scan()
            if not check(expression()):
                return 'invalid array arguments'
            scan()
            while nxtsymb[2] == ',':
                scan()
                if not check(expression()):
                    return 'invalid array arguments'
                scan()
            if nxtsymb[2] != ']':
                return '\']\' expected'
            scan()
        if nxtsymb[2] == ':=':
            if not check(assignment()):
                return 'invalid assignment declaration'
            return ''
        if nxtsymb[2] == '(':
            scan()
            if not check(expression()):
                return 'invalid argument'
            scan()
            while nxtsymb[2] == ',':
                scan()
                if not check(expression()):
                    return 'invalid argument'
                scan()
            if nxtsymb[2] != ')':
                return 'expected \')\''
            return ''
        return 'unexpected "' + nxtsymb[2] + '"'
    elif nxtsymb[2] == 'if':
        scan()
        if not check(condition()):
            return 'condition expected'
        scan()
        if nxtsymb[2] != 'then':
            return '"then" expected'
        scan()
        if not check(operator()):
            return 'operator expected'
        scan()
        if nxtsymb[2] == 'else':
            scan()
            if not check(operator()):
                return 'operator expected'
        else:
            antiscan()
    elif nxtsymb[2] == 'goto':
        scan()
        if nxtsymb[0] != 'I':
            return 'identifier expected'
    elif nxtsymb[2] == 'while':
        scan()
        if not check(condition()):
            return 'condition expected'
        scan()
        if nxtsymb[2] != 'do':
            return '"do" expected'
        scan()
        if not check(operator()):
            return 'operator expected'
    elif nxtsymb[2] == 'return':
        scan()
        if not check(expression()):
            return 'return\'s exression expected'
    else:
        return 'not operator'
    return ''
def operator():
    global nxtsymb
    # print(Fore.GREEN + 'operator' + Style.RESET_ALL)

    if nxtsymb[2] == ';':
        pass
    elif nxtsymb[0] == 'I':
        scan()
        if nxtsymb[2] == ':':
            return ''
        if nxtsymb[2] == '[':
            scan()
            if not check(expression()):
                return 'invalid array arguments'
            scan()
            while nxtsymb[2] == ',':
                scan()
                if not check(expression()):
                    return 'invalid array arguments'
                scan()
            if nxtsymb[2] != ']':
                return '\']\' expected'
            scan()
        if nxtsymb[2] == ':=':
            if not check(assignment()):
                return 'invalid assignment declaration'
            return ''
        if nxtsymb[2] == '(':
            scan()
            if not check(expression()):
                return 'invalid argument'
            scan()
            while nxtsymb[2] == ',':
                scan()
                if not check(expression()):
                    return 'invalid argument'
                scan()
            if nxtsymb[2] != ')':
                return 'expected \')\''
            return ''
        return 'unexpected "' + nxtsymb[2] + '"'
    elif nxtsymb[2] == 'if':
        scan()
        if not check(condition()):
            return 'condition expected'
        scan()
        if nxtsymb[2] != 'then':
            return '"then" expected'
        scan()
        if not check(operator()):
            return 'operator expected'
        scan()
        if nxtsymb[2] == 'else':
            scan()
            if not check(operator()):
                return 'operator expected'
        else:
            scan()
    elif nxtsymb[2] == 'goto':
        scan()
        if nxtsymb[0] != 'I':
            return 'identifier expected'
    elif nxtsymb[2] == 'while':
        scan()
        if not check(condition()):
            return 'condition expected'
        scan()
        if nxtsymb[2] != 'do':
            return '"do" expected'
        scan()
        if not check(operator()):
            return 'operator expected'
    else:
        return 'not operator'
    return ''
def function():
    global nxtsymb
    # print(Fore.GREEN + 'function' + Style.RESET_ALL)

    if nxtsymb[0] != 'I':
        return 'identifier expended'
    scan()
    if nxtsymb[2] == '(':
        scan()
        if not check(var()):
            return 'invalid var declaration'
        scan()
        while nxtsymb[2] == ';':
            scan()
            if not check(var()):
                return 'invalid var declaration'
            scan()
        if nxtsymb[2] != ')':
            return '")" expected'
        scan()
    if nxtsymb[2] != ':':
        return 'expected \':\''
    scan()
    if nxtsymb[2] not in ['integer', 'real', 'string']:
        return 'type of function expected'
    scan()
    if nxtsymb[2] != ';':
        return '";" expected'

    scan()
    if nxtsymb[2] == 'var':
        scan()
        if not check(var()):
            return 'invalid var declaration'
        scan()
        if nxtsymb[2] != ';':
            return '";" expected'
        scan()
        while nxtsymb[0] == 'I':
            if not check(var()):
                return 'invalid var declaration'
            scan()
            if nxtsymb[2] != ';':
                return '";" expected'
            scan()

    while nxtsymb[2] in ['function', 'procedure']:
        if not check(function_or_procedure()):
            return 'invalid function or procedure declaration'

    #     scan()
    if nxtsymb[2] != 'begin':
        return '"begin" expected'

    scan()
    while len(operator()) == 0:
        scan()
        if cursymb[2] != ':':
            if nxtsymb[2] != ';':
                return '";" expected'
            scan()

    if nxtsymb[2] != 'return':
        return 'function have to return some value'
    scan()
    if not check(expression()):
        return 'return\'s exression expected'
    scan()
    if nxtsymb[2] != ';':
        return '";" expected'

    scan()
    while len(operator_and_return()) == 0:
        scan()
        if cursymb[2] != ':':
            if nxtsymb[2] != ';':
                return '";" expected'
            scan()

    if nxtsymb[2] != 'end':
        if cursymb[2] == ';' and nxtsymb[2] == 'else':
            return 'extra ";" before else'
        return 'unexpected "' + nxtsymb[2] + '"'
    scan()
    if nxtsymb[2] != ';':
        return '";" expected'
    scan()
    return ''
def procedure():
    global nxtsymb
    # print(Fore.GREEN + 'procedure' + Style.RESET_ALL)

    if nxtsymb[0] != 'I':
        return 'identifier expended'
    scan()
    if nxtsymb[2] == '(':
        scan()
        if not check(var()):
            return 'invalid var declaration'
        scan()
        while nxtsymb[2] == ';':
            scan()
            if not check(var()):
                return 'invalid var declaration'
            scan()
        if nxtsymb[2] != ')':
            return '")" expected'
        scan()
    if nxtsymb[2] != ';':
        return '";" expected'

    scan()
    if nxtsymb[2] == 'var':
        scan()
        if not check(var()):
            return 'invalid var declaration'
        scan()
        if nxtsymb[2] != ';':
            return '";" expected'
        scan()
        while nxtsymb[0] == 'I':
            if not check(var()):
                return 'invalid var declaration'
            scan()
            if nxtsymb[2] != ';':
                return '";" expected'
            scan()

    while nxtsymb[2] in ['function', 'procedure']:
        if not check(function_or_procedure()):
            return 'invalid function or procedure declaration'

    #     scan()
    if nxtsymb[2] != 'begin':
        return '"begin" expected'
    scan()
    while len(operator()) == 0:
        scan()
        if cursymb[2] != ':':
            if nxtsymb[2] != ';':
                return '";" expected'
            scan()
    if nxtsymb[2] != 'end':
        if cursymb[2] == ';' and nxtsymb[2] == 'else':
            return 'extra ";" before else'
        return 'unexpected "' + nxtsymb[2] + '"'
    scan()
    if nxtsymb[2] != ';':
        return '";" expected'
    scan()
    return ''
def function_or_procedure():
    global nxtsymb
    # print(Fore.GREEN + 'function_or_procedure' + Style.RESET_ALL)

    if nxtsymb[2] == 'procedure':
        scan()
        if not check(procedure()):
            return 'invalid procedure declaration'
        return ''
    if nxtsymb[2] == 'function':
        scan()
        if not check(function()):
            return 'invalid function declaration'
        return ''
    return ''
def interval():
    global nxtsymb
    # print(Fore.GREEN + 'interval' + Style.RESET_ALL)

    if nxtsymb[0] != 'C':
        return 'constant expected'
    scan()
    if nxtsymb[2] != '..':
        return '".." expected'
    scan()
    if nxtsymb[0] != 'C':
        return 'constant expected'
    return ''
def var_type():
    global nxtsymb
    # print(Fore.GREEN + 'var_type' + Style.RESET_ALL)

    if nxtsymb[2] in ['integer', 'real', 'string']:
        return ''
    elif nxtsymb[2] == 'array':
        scan()
        if nxtsymb[2] != '[':
            return '"[" expected'
        scan()
        if not check(interval()):
            return 'invalid interval syntax'
        scan()
        while nxtsymb[2] == ',':
            scan()
            if not check(interval()):
                return 'invalid interval syntax'
            scan()
        if nxtsymb[2] != ']':
            return '"]" expected'
        scan()
        if nxtsymb[2] != 'of':
            return '"of" expected'
        scan()
        if nxtsymb[2] not in ['integer', 'real', 'string']:
            return 'variable type expected'
        return ''
    else:
        return 'array type expected'
def var():
    global nxtsymb
    # print(Fore.GREEN + 'var' + Style.RESET_ALL)

    if nxtsymb[0] != 'I':
        return 'identifier expexted'
    scan()
    while nxtsymb[2] == ',':
        scan()
        if nxtsymb[0] != 'I':
            return 'identifier expected'
        scan()
    if nxtsymb[2] != ':':
        return '":" expected'
    scan()
    if not check(var_type()):
        return 'invalid variable type declaration'
    return ''
def program():
    global nxtsymb
    # print(Fore.GREEN + 'program' + Style.RESET_ALL)

    scan()
    if nxtsymb[0] != 'I':
        return 'identifier expected'
    scan()
    if nxtsymb[2] != ';':
        return '";" expected'
    return ''
def wrapper():
    global nxtsymb, cursymb
    scan()
    if nxtsymb[2] == 'program':
        if not check(program()):
            return 'invalid program declaration'

    scan()
    if nxtsymb[2] == 'var':
        scan()
        if not check(var()):
            return 'invalid var declaration'
        scan()
        if nxtsymb[2] != ';':
            return '";" expected'
        scan()
        while nxtsymb[0] == 'I':
            if not check(var()):
                return 'invalid var declaration'
            scan()
            if nxtsymb[2] != ';':
                return '";" expected'
            scan()

    #     scan()
    while nxtsymb[2] in ['function', 'procedure']:
        if not check(function_or_procedure()):
            return 'invalid function or procedure declaration'

    #     scan()
    if nxtsymb[2] != 'begin':
        return '"begin" expected'
    scan()
    while len(operator()) == 0:
        scan()
        if cursymb[2] != ':':
            if nxtsymb[2] != ';':
                return '";" expected'
            scan()
    print('END', nxtsymb[2])
    if nxtsymb[2] != 'end.':
        if cursymb[2] == ';' and nxtsymb[2] == 'else':
            return 'extra ";" before else'
        return 'unexpected "' + nxtsymb[2] + '"'


# 3 laba

priority = dict(
    [('W10', 0), ('W14', 0), ('R5', 0), ('R7', 0), ('АЭМ', 0), ('W1', 0), ('W7', 0), ('W19', 0), ('W20', 0), ('W21', 0),
      ('КЦД', 0),
     ('R1', 1), ('R4', 1), ('R6', 1), ('R8', 1), ('W15', 1), ('W16', 1), ('W22', 1),
     ('W12', 2), ('W13', 2),
     ('O5', 3), ('O6', 3), ('O7', 3), ('O8', 3), ('O9', 3), ('O10', 3), ('R2', 3),
     ('O0', 4), ('O1', 4),
     ('O2', 5), ('O3', 5),
     ('O4', 6),
     ('W9', 7), ('W17', 7), ('R3', 7), ('W18', 7)])

stack = []
out_line = ''
normal_line = ''
tempState = ''
lableStack = []

def to_rpn(line):
    flagAEM = flagF = flagBegin = flagVar = flagConst = flagProc = flagLocal = flagFunc = flag_arr_dcl = flagBeginProc = flagBeginLoop = flagLable  = False
    tempAEM = dcl3 = tempIf = procCounter = arrDcl = 1
    flagIf = flagFor = flagWhile = 0
    work_line = line.split(' ')
    global out_line, tempState, stack
    for index, word in enumerate(work_line):
        # out_line += ' $$' + str(dcl3) + '$$ '
        print('Pre-stack:', stack, 'ind', index, word)
        if word[0] == "I" or word[0] == "C" or word[0] == 'M':
            if flagLable:
                lableStack.append(word)
            # Здесь надо проверять не I и C, а массив меток, но у меня его нет))
            if word[0] == 'M' and stack and stack[len(stack) - 1] == 'W13':
                out_line += word + ' БП '
                stack.pop()
            else:
                if out_line != '' and out_line[len(out_line) - 1] != ' ':
                    out_line += ' ' + word + ' '
                else:
                    out_line += word + ' '
        # R4 в случае закрытия условного оператора добавляет метку, иначе просто выталкивает все операторы
        elif word == 'R4':
            if flagFor == 2 and not flagBeginLoop:
                while stack and not stack[len(stack) - 1] == 'КЦД':
                    out_line += stack.pop() + ' '
                out_line += stack.pop() + ' '
                flagFor = 0
                flagBeginLoop = False
            if flagWhile == 2 and not flagBegin:
                while stack and not stack[len(stack) - 1] == 'КЦП':
                    out_line += stack.pop() + ' '
                out_line += stack.pop() + ' '
                flagWhile = 0
                flagBeginLoop = False
            elif flagVar:
                # out_line += ' $$' + str(dcl3) + '$$ '
                if dcl3 > 1:
                    out_line += str(dcl3) + ' ' + stack.pop() + ' '
                    dcl3 = 1
                else:
                    out_line += stack.pop() + ' '
            elif not flagBegin and flagIf == 'W16':  # Нет begin блок then
                while stack and not stack[len(stack) - 1] == 'W14':
                    out_line += stack.pop() + ' '
                if stack:
                    stack.pop()
                out_line += 'M' + str(tempIf) + ' R3 '
            elif flagLable:
                flagLable = False
                out_line += stack.pop() + ' '
            else:
                while stack and priority.get(word) <= priority.get(stack[len(stack) - 1], 0):
                    out_line += stack.pop() + ' '
        elif word == 'W1':
            stack.append(word)
            flagVar = True
        elif flagFor == 1 and word == 'W12':
            0
        elif word == 'R3':
            if tempState == 'R6':
                flagFunc = True
            if lableStack.__contains__(
                    out_line[0: len(out_line) - 1].split(' ')[len(out_line[0: len(out_line) - 1].split(' ')) - 1]):
                out_line += word + ' '
        elif word == 'W3' or word == 'W4' or word == 'W5':
            if flagFunc:
                out_line += word + ' '
                flagFunc = False
            else:
                stack.append(word)
        elif word == 'W9' or word == 'W10':
            flagBeginProc = True
            if word == 'W9':  # Procedure
                flagProc = True
            else:
                flagFunc = True
            # stack.append('W9')
            procCounter += 1
        # Встречаем условие
        elif word == 'W14':
            stack.append(word)
        elif word == 'W15':
            flagIf = 'W15'
            while not stack[len(stack) - 1] == 'W14':
                out_line += stack.pop() + ' '
            # if stack:
            #     stack.pop()
            out_line += 'M' + str(tempIf) + ' ' + 'УПЛ '
        elif word == 'W16':
            flagIf = 'W16'
            while not stack[len(stack) - 1] == 'W14':
                out_line += stack.pop() + ' '

            if stack:
                stack.pop()
            tempIf += 1
            out_line += 'M' + str(tempIf) + ' БП ' + 'M' + str(tempIf - 1) + ' R3 '
        elif word == 'W17':
            if flagIf == 'W16' or flagIf == 'W15':
                while stack and not stack[len(stack) - 1] == 'W14':
                    out_line += stack.pop() + ' '
                if stack:
                    stack.pop()
                out_line += 'M' + str(tempIf) + ' R3 '
            if flagFor == 2:
                while stack and not stack[len(stack) - 1] == 'КЦД':
                    out_line += stack.pop() + ' '
                out_line += stack.pop() + ' '
                flagFor = 0
            if flagWhile == 2:
                while stack and not stack[len(stack) - 1] == 'КЦП':
                    out_line += stack.pop() + ' '
                out_line += stack.pop() + ' '
                flagWhile = 0
            flagFor = 0
            if flagBeginProc:
                out_line += word + ' '
                flagBeginProc = False
            flagBegin = not flagBegin
            flagIf = 'R17'
        # Открывающая скобка, если это не функция, заносится в стек,
        # если функция - оператор Ф со значением счетчика 1
        elif word == 'R5':
            if flagProc:
                out_line += str(procCounter) + ' ' + 'НП '
                stack.append(word)
                flagVar = True
            elif flagFunc:
                out_line += str(procCounter) + ' ' + 'НФ '
                stack.append(word)
                flagVar = True
            else:
                stack.append(word)
        # Закрывающая скобка выталкивает все операторы из стека, если встречается оператор Ф, то наращивается
        # его счетчик и они выталкиваются, если встретился оператор R5, то они самоликвидируются
        elif word == 'R6':
            if flagF:
                while not stack[len(stack) - 1] == 'Ф':
                    out_line += stack.pop() + ' '
                tempF += 1
                out_line += str(tempF) + stack.pop() + ' '
                flagF = False
            elif flagProc:
                while not stack[len(stack) - 1] == 'R5':
                    out_line += stack.pop() + ' '
                if dcl3 > 1:
                    out_line += str(dcl3) + ' ' + 'PAR '
                    dcl3 = 1
                else:
                    out_line += 'PAR '
                stack.pop()
                flagVar = False
            else:
                while not stack[len(stack) - 1] == 'R5':
                    out_line += stack.pop() + ' '
                stack.pop()
        # Открывающаяся фигурная скобка добавляет в стэк оператор АЭМ со значением счетчика 2
        elif word == 'R7':
            if not flagVar:
                stack.append('АЭМ')
                tempAEM = 2
                flagAEM = True
            else:
                0
        elif word == 'W7':
            stack.append('ARDCL')
            flag_arr_dcl = True
        elif word == 'R2':
            arrDcl += 1
        # Запятая внутри квадратных скобок выталкивает все операторы из стека до АЭМ и увеличивает его счетчик
        elif word == 'R1':
            if flag_arr_dcl:
                arrDcl += 1
            if flagAEM:
                while not stack[len(stack) - 1] == 'АЭМ':
                    out_line += stack.pop() + ' '
                tempAEM += 1
            if flagF:
                while not stack[len(stack) - 1] == 'Ф':
                    out_line += stack.pop() + ' '
                tempF += 1
            if stack and (
                    stack[len(stack) - 1] == 'W3' or stack[len(stack) - 1] == 'W4' or stack[len(stack) - 1] == 'W5'):
                out_line += stack.pop() + ' '
            if flagLocal:
                out_line += stack.pop() + ' '
            if flagConst:
                constCounter += 1
        # Закрывающаяся квадратная скобка выталкивает все операторы из стека до АЭМ, увеличивает его счетчик,
        # после чего выталкивает сам оператор АЕМ с его счетчиком
        elif word == 'R8':
            if not flagVar:
                while not stack[len(stack) - 1] == 'АЭМ':
                    out_line += stack.pop() + ' '
                out_line += str(tempAEM) + ' ' + stack.pop() + ' '
                flagAEM = False
                tempAEM = 2
        elif word == 'W8':
            while not stack[len(stack) - 1] == 'ARDCL':
                out_line += stack.pop() + ' '
            arrDcl += 1
            out_line += str(arrDcl) + ' ' + stack.pop() + ' '
            flag_arr_dcl = False
            arrDcl = 1
        elif word == 'W11' or word == 'W2' or word == 'W6':
            if flagProc:
                flagProc = False
            if flagFor or flagWhile:
                flagBeginLoop = True
            if flagVar:
                while stack and not stack[len(stack) - 1] == 'W1':
                    out_line += stack.pop() + ' '
                out_line += str(procCounter) + ' ' + 'КО '
                stack.pop()
                flagVar = False
            if word == 'W6':
                flagLable = True
                stack.append(word)
            flagBegin = True
            proc3 = 1
            if (word == 'W2' or word == 'W6') and flagVar:
                flagVar = False
                flagConst = True
                constCounter = 1
        elif word == 'W18':
            out_line += word
        elif word == 'W19':
            flagFor = 1
            tempLoopCounter = 2
            stack.append('КЦД')
            stack.append('НЦД')  # Начало Цикла Для
        elif word == 'W21':
            flagWhile = 1
            tempLoopCounter = 2
            stack.append('КЦП')
            stack.append('НЦП')
        elif word == 'W20':
            if flagFor:
                while stack and not stack[len(stack) - 1] == 'НЦД':
                    out_line += stack.pop() + ' '
                out_line += str(tempLoopCounter) + ' ' + stack.pop() + ' '
                stack.append(word)
                if flagFor == 1:
                    flagFor = 2
                tempLoopCounter = 1
        elif word == 'W22':
            if flagFor:
                while stack and not stack[len(stack) - 1] == 'W20':
                    out_line += stack.pop() + ' '
                out_line += str(tempLoopCounter) + ' TO ' + stack.pop() + ' '
                if flagFor == 1:
                    flagFor = 2
            if flagWhile:
                while stack and not stack[len(stack) - 1] == 'НЦП':
                    out_line += stack.pop() + ' '
                out_line += str(tempLoopCounter) + ' ' + stack.pop() + ' '
                if flagWhile == 1:
                    flagWhile = 2
        elif not stack:
            stack.append(word)
        # Если приоритет операции ниже, чем крайней операции в стеке, то он просто проталкивается в стек
        elif priority.get(word) > priority.get(stack[len(stack) - 1], 0):
            stack.append(word)
            if (flagFor or flagWhile or flagAEM) and (word == 'O0' or word == 'O1' or word == 'O2' or word == 'O3'):
                if flagAEM:
                    tempAEM += 1
                else:
                    tempLoopCounter += 1
        # Если приоритет операции выше, чем крайней операции в стеке, то выталкиваются все операторы до тех пор,
        # пока не встретится оператор с таким же или выше приоритетом
        elif priority.get(word) <= priority.get(stack[len(stack) - 1], 0):
            while stack and priority.get(word) <= priority.get(stack[len(stack) - 1], 0):
                out_line += stack.pop() + ' '
            stack.append(word)
            if (flagFor or flagWhile) and (word == 'O0' or word == 'O1' or word == 'O2' or word == 'O3'):
                tempLoopCounter += 1
        tempState = word
        print('out:', out_line)
        print('post-stack:', stack, '\n', 'procCounter', procCounter, flagAEM, flagF, flagBegin, flagVar, flagConst, flagProc, flagLocal, flagFunc, flag_arr_dcl, flagBeginLoop, flagLable, '\n')
    # Дописываются оставшиеся в стэке операторы
    while stack:
        out_line += stack.pop() + ' '
    print(out_line)
    return out_line
def to_normal(line):
    global normal_line
    line = line.split(' ')
    for word in line:
        if word[0] == 'I' or word[0] == 'C' or word[0] == 'M' or word == 'КЦД' or word == 'НЦД' or word == 'КЦП' or word == 'НЦП' or word == 'АЭМ' or word == 'КЦД' or word == 'УПЛ':
            normal_line += word
        if word == 'ARDCL':
            normal_line += word
        if str(word).isnumeric():
            normal_line += word
        if word == 'W0':
            normal_line += 'program'
        if word == 'W1':
            normal_line += 'var'
        if word == 'W2':
            normal_line += 'const'
        if word == 'W3':
            normal_line += 'integer'
        if word == 'W4':
            normal_line += 'real'
        if word == 'W5':
            normal_line += 'string'
        if word == 'W6':
            normal_line += 'label'
        if word == 'W7':
            normal_line += 'array'
        if word == 'W8':
            normal_line += 'of'
        if word == 'W9':
            normal_line += 'procedure'
        if word == 'W10':
            normal_line += 'function'
        if word == 'W11':
            normal_line += 'begin'
        if word == 'W12':
            normal_line += ':='
        if word == 'W13':
            normal_line += 'goto'
        if word == 'W14':
            normal_line += 'if'
        if word == 'W15':
            normal_line += 'then'
        if word == 'W16':
            normal_line += 'else'
        if word == 'W17':
            normal_line += 'end'
        if word == 'W18':
            normal_line += 'end.'
        if word == 'W19':
            normal_line += 'for'
        if word == 'W20':
            normal_line += 'to'
        if word == 'W21':
            normal_line += 'while'
        if word == 'W22':
            normal_line += 'do'
        if word == 'O0':
            normal_line += '+'
        if word == 'O1':
            normal_line += '-'
        if word == '02':
            normal_line += '*'
        if word == 'O3':
            normal_line += '/'
        if word == 'O4':
            normal_line += '^'
        if word == 'O5':
            normal_line += '<'
        if word == 'O6':
            normal_line += '>'
        if word == 'O7':
            normal_line += '='
        if word == 'O8':
            normal_line += '<>'
        if word == 'O9':
            normal_line += '<='
        if word == 'O10':
            normal_line += '>='
        if word == 'O11':
            normal_line += '<'
        if word == 'O12':
            normal_line += '>'
        if word == 'R0':
            normal_line += ' '
        if word == 'R1':
            normal_line += ','
        if word == 'R2':
            normal_line += '..'
        if word == 'R3':
            normal_line += ':'
        if word == 'R4':
            normal_line += ';'
        if word == 'R5':
            normal_line += '('
        if word == 'R6':
            normal_line += ')'
        if word == 'R7':
            normal_line += '['
        if word == 'R8':
            normal_line += ']'
        if word == 'R9':
            normal_line += '{'
        if word == 'R10':
            normal_line += '}'
        normal_line += ' '
    print(normal_line)

def index(request):
    context = {'data': 'hi'}
    return render(request, '../templates/index.html', context)

def parse(request):
    global service_words
    global operations
    global separators
    global constants
    global identifiers
    global tokens_chain, nxtsymb, cursymb, token_index, mistakes

    identifiers = []
    constants = []

    code = request.POST.get('code')
    chain = to_token_analyze(code)

    with open('./results/lab1.json') as lab1_file:
        data = json.load(lab1_file)

    tokens_chain = chain
    mistakes = []
    nxtsymb = []
    cursymb = []
    token_index = -1
    result = wrapper()
    if result:
        error(result)


    stringifyChain = ''
    for unit in chain:
        stringifyChain += unit[0] + str(unit[1]) + ''
    stringifyChain = stringifyChain[:-1]
    rpn = to_rpn(stringifyChain)

    data = {
        'data': json.dumps({
            'chain': chain,
            'tables': {
                'service_words': service_words,
                'operations': operations,
                'separators': separators,
                'constants': constants,
                'identifiers': identifiers
            },
            'mistakes': mistakes,
            'rpn': rpn
        })
    }

    return render(request, 'parse_response.html', data)


service_words = ['program', 'var', 'const', 'integer', 'real', 'string', 'label',
                 'array', 'of', 'procedure', 'function',
                 'begin', ':=', 'goto', 'if', 'then', 'else', 'end', 'end.']
operations = ['+', '-', '*', '/', '^', '<', '>', '=', '<>', '<=', '>=']
separators = [' ', ',', '..', ':', ';', '(', ')', '[', ']', '{', '}', '\'']

def filter_program(text):
    splitted_text = text.split('\'')
    formatted_text = []
    even_flag = False
    for span in splitted_text:
        if not even_flag:
            formatted_span = re.sub(r'[\t\n]+', ' ', span)
            formatted_span = re.sub(r' +', ' ', formatted_span)
            formatted_span = re.sub(r'\{.*\}', '', formatted_span)
            formatted_text.append({
                'text': formatted_span.lower(),
                'type': 'code'
            })
        else:
            formatted_text.append({
                'text': span,
                'type': 'string'
            })

        even_flag = not even_flag
    if not even_flag:
        # print(Fore.RED + 'Unexpected end of file. There is unclosed apostrophe!' + Style.RESET_ALL)
        return None

    #     formatted_text = formatted_text.replace('\\', '\\\\')

    return formatted_text


class Analyzer:
    state = 'S'
    string = ''
    collecting_string = ''

    def __init__(self, string):
        self.string = string

    def reset(self):
        self.collecting_string = ''
        self.state = 'S'

    def unexpected(self, symbol):
        self.state = 'error'
        # print(Back.RED, Fore.WHITE, 'ERRORE!', Style.RESET_ALL, 'Unexpected symbol \"' + symbol + '\"')
        return {
            'kind': 'error',
            'token': symbol,
            'residue': ''
        }

    def symbol_return(self, symbol):
        self.string = symbol + self.string
        if symbol != '':
            self.collecting_string = self.collecting_string[:-1]

    def collect_next(self):
        #         print('String: "',  end='')
        #         print(Fore.BLUE + self.string + Style.RESET_ALL, end='')
        #         print('"')

        try:
            symbol = self.string[0]
            self.string = self.string[1:]
        except:
            symbol = ''
        self.collecting_string += symbol

        if self.state == 'S':
            if symbol.isalpha() or symbol == '_':
                self.state = 'letter_at_first'
            elif symbol == '<':
                self.state = '<_at_first'
            elif symbol == '>':
                self.state = '>_at_first'
            elif symbol in operations:
                return {
                    'kind': 'operation',
                    'token': symbol,
                    'residue': self.string
                }
            elif symbol.isdigit():
                self.state = 'digit_at_first'
            elif symbol == '.':
                self.state = '._at_first'
            return self.collect_next()

        if self.state in ['number -> .. -> number']:
            if symbol.isdigit():
                return self.collect_next()
            elif symbol in operations + ['']:
                self.symbol_return(symbol)
                return {
                    'kind': 'integer_interval',
                    'token': self.collecting_string,
                    'residue': self.string
                }
            else:
                return self.unexpected(symbol)

        if self.state in ['number -> ..']:
            if symbol.isdigit():
                self.state = 'number -> .. -> number'
                return self.collect_next()
            else:
                return self.unexpected(symbol)

        if self.state == 'digit_at_first':
            if symbol.isdigit():
                return self.collect_next()
            elif symbol == '.':
                self.state = 'number -> .'
                return self.collect_next()
            elif symbol == 'e':
                self.state = 'number -> e'
                return self.collect_next()
            elif symbol in operations + ['']:
                self.symbol_return(symbol)
                return {
                    'kind': 'integer',
                    'token': self.collecting_string,
                    'residue': self.string
                }
            else:
                return self.unexpected(symbol)

        if self.state == 'number -> .':
            if symbol == '.':
                self.symbol_return(symbol)
                self.symbol_return(symbol)
                return {
                    'kind': 'integer',
                    'token': self.collecting_string,
                    'residue': self.string
                }

        if self.state == '._at_first':
            if symbol == '.':
                return {
                    'kind': 'separator',
                    'token': self.collecting_string,
                    'residue': self.string
                }

        if self.state in ['._at_first', 'number -> .']:
            if symbol.isdigit():
                return self.collect_next()
            elif symbol == 'e':
                self.state = 'number -> e'
                return self.collect_next()
            elif symbol in operations + ['']:
                self.symbol_return(symbol)
                return {
                    'kind': 'real',
                    'token': self.collecting_string,
                    'residue': self.string
                }
            elif symbol == '.':
                self.state = 'number -> ..'
                return self.collect_next()
            else:
                return self.unexpected(symbol)

        if self.state == 'number -> e':
            if symbol in ['+', '-']:
                self.state = 'number -> e -> +/-'
                return self.collect_next()
            elif symbol.isdigit():
                self.state = 'number -> e -> digit'
                return self.collect_next()
            else:
                return self.unexpected(symbol)

        if self.state in ['number -> e -> +/-', 'number -> e -> digit']:
            if symbol.isdigit():
                return self.collect_next()
            elif symbol in operations + ['']:
                self.symbol_return(symbol)
                return {
                    'kind': 'real',
                    'token': self.collecting_string,
                    'residue': self.string
                }
            else:
                return self.unexpected(symbol)

        if self.state == '<_at_first':
            if symbol in ['>', '=']:
                return {
                    'kind': 'operation',
                    'token': self.collecting_string,
                    'residue': self.string
                }
            else:
                self.symbol_return(symbol)
                return {
                    'kind': 'operation',
                    'token': self.collecting_string,
                    'residue': self.string
                }

        if self.state == '>_at_first':
            if symbol == '=':
                return {
                    'kind': 'operation',
                    'token': self.collecting_string,
                    'residue': self.string
                }
            else:
                self.symbol_return(symbol)
                return {
                    'kind': 'operation',
                    'token': self.collecting_string,
                    'residue': self.string
                }

        if self.state == 'letter_at_first':
            if symbol.isalpha() or symbol.isdigit() or symbol == '_':
                return self.collect_next()
            elif symbol in operations + ['']:
                self.symbol_return(symbol)
                return {
                    'kind': 'identifier',
                    'token': self.collecting_string,
                    'residue': self.string
                }
            else:
                return self.unexpected(symbol)

        return {
            'kind': 'exeption',
            'token': str(self.state),
            'residue': self.string
        }


def append_consumable(token, kind, number_of_procedure=0, level_of_procedure=0, number_in_procedure=0):
    global constants
    global identifiers

    if kind in ['integer', 'real', 'string', 'integer_interval']:
        constant = {
            'type': kind,
            'value': token
        }
        if not constant in constants:
            constants.append(constant)
    elif kind == 'identifier':
        identifier = {
            'type': kind,
            'name': token,
            'number_of_procedure': number_of_procedure,
            'level_of_procedure': level_of_procedure,
            'number_in_procedure': number_in_procedure
        }
        if not identifier in identifiers:
            identifiers.append(identifier)


def split_by_separator(line):
    global separators

    #     Search first separator or assignment
    first_separator_index = len(line)
    for character in line:
        if character in separators:
            first_separator_index = line.index(character)
            break

    #   Token kind determinination
    token = line[:first_separator_index]
    separator = ''
    if first_separator_index < len(line):
        separator = line[first_separator_index]

    kind = 'unknown'
    if token in service_words:
        kind = 'service_word'
    elif token in operations:
        kind = 'operation'

    #     Checking for String
    elif not token and separator == '\'':
        kind = 'string'

        #         Search second apostrophe
        second_apostrophe_index = 1
        if len(line) > 1:
            while line[second_apostrophe_index] != '\'' and second_apostrophe_index < len(line):
                second_apostrophe_index += 1

        #         Slicing string constant from line
        token = line[1:second_apostrophe_index]
        separator = '\''
        first_separator_index = second_apostrophe_index - 1

        return {
            'token': token,
            'kind': kind,
            'separator': separator,
            'remaining_line': line[second_apostrophe_index + 1:]
        }
    #     Assignment regognition
    elif not token and separator == ':' and line[first_separator_index + 1] == '=':
        kind = 'service_word'
        token = ':='
        separator = ''
        first_separator_index += 1

    else:
        #         Checking for Int, Real, Indetifier
        try:
            int(token)
            kind = 'integer'
        except:
            kind = 'unknown'

    #     Preparation to detect assignment operator
    if separator == ':':
        try:
            if line[first_separator_index + 1] == '=':
                separator = ''
                first_separator_index -= 1
        except:
            pass

    if separator == '\'':
        first_separator_index -= 1

    try:
        if line[first_separator_index + 1] == '\'' and (not separator.isspace()) and separator != '\'':
            line = line[:first_separator_index + 1] + ' ' + line[first_separator_index + 1:]
        elif line[first_separator_index + 1] == '\'' and separator.isspace():
            separator = '\'';
    except:
        pass

    return {
        'token': token,
        'kind': kind,
        'separator': separator,
        'remaining_line': line[first_separator_index + 1:]
    }


def to_token_analyze(code):
    global tokens_chain

    program = filter_program(code)
    #     print(program)

    if not program:
        return None

    #     print(Fore.BLUE, program, Style.RESET_ALL)

    tokens_chain = []

    program_context_flag = False
    var_context_flag = False
    array_context_flag = False
    label_context_flag = False
    function_context_flag = False
    procedure_context_flag = False
    var_pool = []

    for segment in program:
        if segment['type'] == 'code':
            #             for line in lines:
            remaining_line = segment['text']
            splitted_line = split_by_separator(remaining_line)
            while remaining_line:
                token = splitted_line['token']
                kind = splitted_line['kind']
                separator = splitted_line['separator']
                remaining_line = splitted_line['remaining_line']

                kind_suffix = ''
                if token or kind == 'string':
                    if kind == 'service_word':
                        tokens_chain.append([
                            'W',
                            service_words.index(token),
                            token,
                            'service-word'
                        ])
                        kind_suffix = 'W' + str(service_words.index(token))

                        if token == 'array':
                            array_context_flag = True
                        else:
                            if token in ['integer', 'real', 'string']:
                                var_type = token
                                if array_context_flag:
                                    var_type += '_array';

                                for var in var_pool:
                                    identifiers[:] = [d for d in identifiers if d.get('name') != var]
                                    identifiers.append({
                                        'type': var_type,
                                        'name': var,
                                        'number_of_procedure': 0,
                                        'level_of_procedure': 0,
                                        'number_in_procedure': 0
                                    })
                                var_pool = []
                                array_context_flag = False

                            elif token != 'of':
                                if token == 'var':
                                    var_context_flag = True
                                else:
                                    var_context_flag = False

                                if token == 'program':
                                    program_context_flag = True
                                else:
                                    program_context_flag = False

                                if token == 'label':
                                    label_context_flag = True
                                else:
                                    label_context_flag = False

                                if token == 'function':
                                    function_context_flag = True
                                else:
                                    #                                 print('FUNCTION FLAG FALSE')
                                    function_context_flag = False


                    elif kind == 'operation':
                        tokens_chain.append([
                            'O',
                            operations.index(token),
                            token,
                            'operation'
                        ])
                        kind_suffix = 'O' + str(operations.index(token))

                    if kind == 'unknown':

                        #                     Automat analyze

                        automat = Analyzer(token)
                        residue = token

                        while residue:
                            automat.reset()
                            analyzed = automat.collect_next()
                            kind = analyzed['kind']
                            token = analyzed['token']
                            residue = analyzed['residue']

                            if kind == 'exeption':
                                # print(Fore.BLACK + '\"' + token + '\"', Fore.RED + kind,
                                #       Fore.WHITE + 'by analyzer' + Style.RESET_ALL, residue)
                                pass
                            else:

                                #                             Var pool
                                if kind == 'identifier' and (
                                        var_context_flag or program_context_flag or label_context_flag):
                                    var_pool.append(token)

                                #                             New identifier
                                if kind == 'identifier' and not len([d for d in identifiers if d.get('name') == token]):
                                    append_consumable(token, kind)

                                    #                             Constant
                                if kind in ['integer', 'real', 'string']:
                                    append_consumable(token, kind)
                                    for index, constant in enumerate(constants):
                                        if constant['value'] == token:
                                            break
                                    tokens_chain.append([
                                        'C',
                                        index,
                                        constant['value'],
                                        'constant',
                                        kind
                                    ])
                                    kind_suffix = 'C' + str(index)

                                #                             Identifier
                                elif kind == 'identifier':
                                    for index, identifier in enumerate(identifiers):
                                        if identifier['name'] == token:
                                            break
                                    tokens_chain.append([
                                        'I',
                                        index,
                                        identifier['name'],
                                        'identifier'
                                    ])
                                    kind_suffix = 'I' + str(index)

                                #                             Separator
                                elif kind in ['separator']:
                                    tokens_chain.append([
                                        'R',
                                        separators.index(token),
                                        token,
                                        'separator'
                                    ])
                                    kind_suffix = 'R' + str(separators.index(token))

                                #                             Operation
                                elif kind in ['operation']:
                                    tokens_chain.append([
                                        'O',
                                        operations.index(token),
                                        token,
                                        'operation'
                                    ])
                                    kind_suffix = 'O' + str(operations.index(token))
                                # print(Fore.BLACK + '\"' + token + '\"', Fore.GREEN + kind,
                                #       Fore.WHITE + 'by analyzer' + Style.RESET_ALL, kind_suffix)

                    else:
                        #                     Pre-recognized constants or handled service words
                        if kind in ['integer', 'string']:
                            append_consumable(token, kind)
                            for index, constant in enumerate(constants):
                                if constant['value'] == token:
                                    break
                            tokens_chain.append([
                                'C',
                                index,
                                constant['value'],
                                'constant',
                                kind
                            ])
                            kind_suffix = 'C' + str(index)
                        # print(Fore.BLACK + '\"' + token + '\"', Fore.GREEN + kind, Style.RESET_ALL + kind_suffix)

                if not separator.isspace():
                    if separator == ';':
                        if program_context_flag:
                            var_type = 'program'
                        else:
                            var_type = 'identifier'
                        if array_context_flag:
                            var_type += '_array';

                        for var in var_pool:
                            identifiers[:] = [d for d in identifiers if d.get('name') != var]
                            identifiers.append({
                                'type': var_type,
                                'name': var,
                                'number_of_procedure': 0,
                                'level_of_procedure': 0,
                                'number_in_procedure': 0
                            })
                        var_pool = []

                    if separator in separators and separator != ' ':
                        tokens_chain.append([
                            'R',
                            separators.index(separator),
                            separator,
                            'separator'
                        ])
                        # print(Fore.BLACK + '\"' + separator + '\"', Fore.GREEN + 'separator',
                              # Style.RESET_ALL + 'R' + str(separators.index(separator)))
                        if separator == ';':
                            pass
                            # print()

                splitted_line = split_by_separator(remaining_line)
        else:
            #             String handle
            append_consumable(segment['text'], 'string')
            for index, constant in enumerate(constants):
                if constant['value'] == segment['text']:
                    break
            tokens_chain.append([
                'C',
                index,
                constant['value'],
                'constant',
                'string'
            ])
            kind_suffix = 'C' + str(index)
            # print(Fore.BLACK + '\"' + segment['text'] + '\"', Fore.RED + 'STRING',
                  # Fore.WHITE + 'by formatter' + Style.RESET_ALL)

    return tokens_chain