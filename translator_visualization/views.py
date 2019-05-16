from django.shortcuts import render

import re
import json

# Create your views here.

service_words = ['program', 'var', 'const', 'integer', 'real', 'string', 'label',
                 'array', 'of', 'procedure', 'function',
                 'begin', ':=', 'goto', 'if', 'then', 'else', 'end', 'end.', 'return', 'while']
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
            'mistakes': mistakes
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