/*首页脚本*/
var w_w=$(document).width(),w_h=$(document).height(),d_w=$(document).width();;
function getWH(){
	w_w=$(document).width();
	d_w=$(document).width();
	w_h=$(window).height();
}

$(function(){
	
	$(window).resize(function(){
		getWH();	
	});
      
    /*移动端*/
	 if(w_w<770){
	 	
		 /*菜单*/
		$(".m-menu").on('click',function(){
			
					$(".homeBox .nav").show();
		});
		
		$("body").bind("click", function (e) {
			var target = $(e.target);
			if (target.closest(".m-menu").length == 0){
				if (target.closest(".homeBox .nav").length == 0) {
					$(".homeBox .nav").hide();
				}
			}
			
		})
	}   
	
	
	

});

function setIndexImgH(){
	/*针对笔记本高度适配*/
	//document.title=w_h;

	

}