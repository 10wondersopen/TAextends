var express = require('express');
var path = require('path');
var router = express.Router();
var fs = require('fs');
var mysql = require('mysql');
var dbconfig = require('../dbconn');

var connection = mysql.createConnection(dbconfig);

/* download image from remote url */
var request = require('request');

var download = function(uri, filename, k, callback){
    request.head(uri, function(err, res, body){
        console.log('content-type',res.headers['content-type']);
        console.log('content-length',res.headers['content-length']);
        request(uri).pipe(fs.createWriteStream("public/USER/"+k+"/images/"+filename)).on('close', callback);
    });
};

router.get('/write', function(req, res) {
    var sess = req.session;
    res.set({
        'Content-Type':'text/html',
        'charset':'utf-8'
    });
    res.render('layout.html',{
        user_id : sess.user_id,
        frame : './partial/editor'
    });
});

router.post('/write',function(req, res){
    console.log("posttest");
    var title = req.body.title;
    var author = req.body.author;
    var content = req.body.editor1;
    var urlregax = /(http(s)?)(:\/\/)?(www\.)?[a-zA-Z0-9-_\.]+([-a-zA-Z0-9:%_\+.~#?&//=]*)?(.(jpg|png|jpeg|gif|bmp))([-a-zA-Z0-9:;%_\+.~#?&//=]*)?/g;
    var url = content.match(urlregax);
    console.log(url);

    //check for url pregmatch
    //if exist download from remote url
    connection.query('SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = "ta_extends" AND TABLE_NAME = "board"',function(err,result){
        console.log(result[0].AUTO_INCREMENT);
        var board_index = result[0].AUTO_INCREMENT;

        //make directories
        fs.mkdirSync('./public/USER/'+board_index, 0666);
        fs.mkdirSync('./public/USER/'+board_index+'/images',0666);

        if(url == null)
            console.log("no url");
        else {
            for (var i = 0; i < url.length; i++) {
                download(url[i], i + ".png", board_index,function () {
                });
                content = content.replace(url[i], '/USER/' + board_index + '/images/' + i + '.png');

            }
            console.log(content);
        }

        var board = {
            title : title,
            author : author,
            content : content,
            author_id : 1
        };

        connection.query('INSERT into board set ?',board,function(err,result){
            if(err){
                console.log(err);
                throw err;
            }
        });

        res.redirect('/board');
    });
});

/* GET users listing. */
router.get('/',function(req,res){
    connection.query("SELECT * from board", function(err, rows){
        console.log("query");
        var board = rows;
  /*          for(var i=0;i<board.length;i++){
                board[i].wtime = rows[i].
            }
    */        var time = rows;
            if(board[0]==null){
                console.log("no board data");
                var board_list = {};
            }
            else {
                console.log("data inputing");
                board_list = board;
            //    console.log(board_list);
            }
            res.render('layout.html',{
                board_data : board_list,
                wtime : time,
                user_id : req.session.user_id,
                frame : './partial/board_list'
            });
        });

    });



router.get('/:k/', function(req, res, next) {
    var k = req.params.k;
    connection.query("SELECT * from board where id="+k,function(err,rows){
        console.log(rows);
        if(rows[0]==null)
            res.redirect("/board_view");
        else
            res.render('layout.html', {
                user_id: req.session.user_id,
                frame:'./partial/board_view',
                board_data:rows
            });
    });
});

router.get('/:k/del',function(req,res){
   var k = req.params.k;
    connection.query("DELETE from board where id="+k,function(err,rows){
        console.log(rows);
        res.redirect('/board');
    })
});

module.exports = router;
