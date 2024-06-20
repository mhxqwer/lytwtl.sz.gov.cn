function creatheaderkey(obj) {
   
    var init = obj; // init 函数内部的对象  obj  外部传进来的对象  得到一个新的对象
    var pro = [] //声明一个空数组
    var $i = 0
    for (var key in init) { //取出对象里面的键  添加到数组中
        pro[$i] = key
        $i++
    }
    pro.sort(); //把数组里面进行排序
    var objs = ''
    var $j = 0
    for (var tmp in init) { // 根据排序好的进行重新赋值
        if ($j != 0) {
            objs += '&' + pro[$j] +'='+ init[pro[$j]]
        } else {
            objs += pro[$j] + '=' + init[pro[$j]]
        }
        $j++;
    }

    /*var secret="";
    if(obj.appid=="acctuser"){
        secret="kFsvphI3HhqSCQQ+X9xAmer9RPuhgLW9NmbvYUw9";
    }else{
        secret="kFsvphI3HhqSCQQ+X9xAmer9RPuhgLW9NmbvUSg8";
    }*/
   
   var secret="kFsvphI3HhqSCQQ+X9xAmer9RPuhgLW9NmbvYUw9";
    objs += '&secret='+secret;

    var sign = hex_md5(objs) // 得到加密后的字符串
    return sign;

}
