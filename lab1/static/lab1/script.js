// function parse() {
//     var data = {
//       type: 'pas',
//       content: 'end'
//     };
//
//     var boundary = String(Math.random()).slice(2);
//     var boundaryMiddle = '--' + boundary + '\r\n';
//     var boundaryLast = '--' + boundary + '--\r\n'
//
//     var body = ['\r\n'];
//     for (var key in data) {
//       // добавление поля
//       body.push('Content-Disposition: form-data; name="' + key + '"\r\n\r\n' + data[key] + '\r\n');
//     }
//
//     body = body.join(boundaryMiddle) + boundaryLast;
//
//     var xhr = new XMLHttpRequest();
//     xhr.open('POST', 'parsing/', true);
//
//     xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
//
//     xhr.onreadystatechange = function() {
//       if (this.readyState != 4) return;
//
//       alert( this.responseText );
//     }
//
//     xhr.send(body)
// }
//
// parse();