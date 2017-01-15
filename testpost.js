// testpost.js

var cheerio = require('cheerio');
var SA = require('superagent');
var SAproxy = require('superagent-proxy');
SAproxy(SA);
var md5 = require('./md5-min.js');


function getResponse(url,callback){
    SA.get(url)
    .end(function(err,res){
        if (!err){
            callback(res);
        }else{
            console.log('retry get');
            setTimeout(function(){
                getResponse(url,callback,num)
            },500);
        }
    });
}

function postResponse(url,data,cookies,callback){
    ip = "123.123.123.123"
    SA.post(url)
    //.proxy('http://113.84.71.122:8118')
    .set("Cookie",cookies)
    .set('User-Agent','Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36') 
    .set('X-Forwarded-For',ip) 
    .set('X-Real-IP',ip) //问卷网读 remote-address 无法伪造
    .set('Content-Type','application/x-www-form-urlencoded')
    //.set('X-Requested-With','XMLHttpRequest')
    .send(data)
    .timeout(5000)
    .end(function(err,res){
        if (typeof(res)!="undefined"){
            console.log("Posting at IP: "+ip);
            callback(res);
        }else{
            console.log("Conect failed, try again ...");
            postResponse(url,data,cookies,callback)
        }
    });
}



function get_s_code(html){
    var $ = cheerio.load(html);
    var rand_int = $('input[name="rand_int"]').attr("value");
    var func_name = html.match('func_name = "(.+?)";')[1];
    var func_create_str = html.match('eval\\(eval\\("(.+?)"\\)\\);')[1];
    var s1 = String.fromCharCode;
    eval(eval(func_create_str));
    eval("var s_code = "+func_name+"("+rand_int+")");
    return s_code;
}

function get_svc(html){
    var $ = cheerio.load(html);
    var proj_id = $('input[name="proj_id"]').attr("value");
    var uuid = $('input[name="idy_uuid"]').attr("value");
    var timestr = $('input[name="timestr"]').attr("value");
    function slice_str(a, b){
        var d, e, c = "";
        for (d = 0; d < a.length / b; d++)
            e = a.charAt(d * b),
            c += e;
        return c
    }
    function ef1(a) {
        var c, b = "";
        for (c = 0; c < a.length; c++)
            b += slice_str(a[c], 2);
        return md5.hex_md5(b)
    }
    var svc = ef1([proj_id,uuid,timestr]);
    return svc;
}

var url = "https://www.wenjuan.com/s/qq26NfJ/";
getResponse(url,function(res){
    var cookie_list = res.headers['set-cookie'];
    var cookies = '';
    for (var i in cookie_list){
        var cookie = cookie_list[i]
        cookie = cookie.substr(0,cookie.indexOf(';')+1);
        cookies = cookies + cookie;
    }
    var html = res.text;
    var $ = cheerio.load(html);
    var proj_id = $('input[name="proj_id"]').attr("value");
    var xsrf = $('input[name="_xsrf"]').attr("value");
    var timestr = $('input[name="timestr"]').attr("value");
    var version = $('input[name="version"]').attr("value");
    var uuid = $('input[name="idy_uuid"]').attr("value");
    var vvv = $('input[name="vvv"]').attr("value");
    var s_func_id = $('input[name="s_func_id"]').attr("value");
    var s_code = get_s_code(html);
    var svc = get_svc(html);
    var rand_int = $('input[name="rand_int"]').attr("value");
    var total_answers_str = '{"58672afd3fcf579d35c41cf9":["58672afd3fcf579d35c41cfa"],"58672aff3fcf579cf8ceb7a4":[["58672aff3fcf579cf8ceb7a6"]],"58672b053fcf579d597d92e5":["58672b053fcf579d597d92e6"],"58672b073fcf579d35c41d01":{"58672b083fcf579d35c41d02_open":"神"}}'
    var postdata = {
        "total_answers_str": total_answers_str
        ,"_xsrf": xsrf
        ,"project_version": version
        ,"idy_uuid": uuid
        ,"timestr": timestr
        ,"rand_int": rand_int
        ,"pconvert_data": {}
        ,"finish_status": 1
        ,"question_captcha_map_str": {}
        ,"vvv": vvv
        ,"s_func_id": s_func_id
        ,"svc": svc
        ,"s_code": s_code
    };
    console.log(cookies);
    console.log(postdata);
    setTimeout(function(){
        postResponse(url,postdata,cookies,function(res){
            console.log()
            console.log(res.text);
            console.log(res.status);
        });
    },1000);

});
