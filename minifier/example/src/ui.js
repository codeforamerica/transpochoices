$.fn.equalHeights = function(px) {

		var currentTallest = 0;
		$(this).each(function(i){
			if ($(this).height() > currentTallest) { currentTallest = $(this).height(); }
		});
	//	if (!px || !Number.prototype.pxToEm) currentTallest = currentTallest.pxToEm(); //use ems unless px is specified
		// for ie6, set height since min-height isn't supported
		if ($.browser.msie && $.browser.version == 6.0) { $(this).css({'height': currentTallest}); 
            $(this).parent().parent().css({'height': currentTallest+32})
            }
    if ($.browser.msie && $.browser.version == 7.0) { 
        $(this).parent().parent().css({'min-height': currentTallest+32})
    }
		$(this).css({'min-height': currentTallest}); 

	return this;
};
 


$(function(){


   // MAIN NAV ANIMATION
   
		   $('#headerNav li a').append('<span class="hover"></span>');

		   $('#headerNav li a').hover( 
          function() {
	         $('.hover', this).stop().animate({
              'opacity': 1
              }, 200)
            },
          function() {
            $('.hover', this).stop().animate({
              'opacity': 0
            }, 200)
          })
          
    // SIDE NAV ANIMATION
    
          //parent elements
    
         var preBackgroundColor = $('.nav>li a').not($('.nav-selected')).css('background-color')
         var prePaddingLeft = $('.nav>li a').not($('.nav-selected')).css('paddingLeft')
         var preColor = $('.nav>li>a').not($('.nav-selected')).css('color')
   
  		   $('#sidebar .nav>li>a').not($('.nav-selected')).hover( 
          function() {
	         $(this).stop().animate({
              backgroundColor: $('.page').css('border-top-color'),
              paddingLeft: '10px',
              color: '#fff'
              }, 200)
            },
          function() {
            $(this).stop().animate({
              backgroundColor: preBackgroundColor,
              paddingLeft: prePaddingLeft,
              color: preColor
            }, 200)
          })
          
          //child elements

           var preSubColor = $('.nav li li a').not($('.nav-selected')).css('color');
          var preBackgroundColor = $('.nav li li a').not($('.nav-selected')).css('background-color')

              
           $('#sidebar .nav li li>a').not($('.nav-selected')).hover( 
              function() {
                $(this).stop().animate({
                    color: '#fff'
                    }, 200)
                $(this).parent().stop().animate({
                    backgroundColor: $('.page').css('border-top-color')
                }, 200)
                  preBackgroundImage = $(this).parent().css('background-image');
                 $(this).parent().css('background-image','none')

                },
              function() {
                $(this).parent().css('background-image',preBackgroundImage)


                $(this).stop().animate({
                  color: preSubColor
                }, 200)
                $(this).parent().stop().animate({
                  backgroundColor: preBackgroundColor
              }, 200)
            });          
  
      // PRODUCT BANNERS ANIMATION
	  
	  $('.learnMore').append('<span class="hover"></span>');
	  
	  $('.productContainer').hover( 
          function() {
	         $('.hover', this).stop().animate({
              'opacity': 1,
			  'filter': 'alpha(opacity = 100)'
              }, 200)
            },
          function() {
            $('.hover', this).stop().animate({
              'opacity': 0,
			  'filter': 'alpha(opacity = 0)'
			  }, 200)
		});
          
      // News Block hovering 
      /*
      
      $('.newsPostPreview ').hover( 
          function() {
	         $(this).stop().animate({
              backgroundColor: '#E26A3B',
              color: '#fff'
              }, 200)
            },
          function() {
            $(this).stop().animate({
              backgroundColor: 'transparent',
              color: '#fff'
            }, 200)
          })
      */
  
  
     //LIST BLOCK HOVER
     
     function hoverPanel($elID) {
          

        
        $elID.hover( 
          function() {
            preLinkColor =  $(this).css('color')
            preBackgroundColor = '#ffffff'
            preDescripColor = $(this).css('color') 
          
           // FULL BOX ANIMATION
	         $(this).stop().animate({  
              backgroundColor: $('.page').css('border-top-color'),
              paddingLeft: '10px',
              color: '#fff'
              }, 200)
           // DESCRIPTION COLOR FLIP
 	         $(this).find('.clientDescrip').stop().animate({ 
              color: '#fff'
              }, 200)
           // FLIP PRODUCT BG
           if ($(this).find('.productLogo').length != 0) {
            
            bgX = $(this).find('.productLogo').css('background-position').split(" ")[0];
            bgY = $(this).find('.productLogo').css('background-position').split(" ")[1];
            $(this).find('.productLogo').stop().css('background-position','-160px '+ bgY);
            }
           
            },
          function() {
            $(this).stop().animate({
              backgroundColor: preBackgroundColor,
              paddingLeft: prePaddingLeft,
              color: preLinkColor
            }, 200)
            $(this).find('.clientDescrip').stop().animate({
              color: preDescripColor
              }, 200)    
            if ($(this).find('.productLogo').length != 0) {
              $(this).find('.productLogo').stop().css('background-position',bgX+' '+bgY);  
            }
          });    
     
     }

     
      //APPLY CLIENT LIST HOVER STYLING
      hoverPanel($('.listBlock li a').not('.newsPostPreview, .libraryBlock, .postThumb a, .postTitle, .fileList a'));
      //APPLY CLIENT LIST HEIGHT EQUALIZATION
      $('.clientList .list').each(function() {
        $(this).find('li a').equalHeights();
      })

  
  
  
  
    // SEARCHBOX FOCUS 
      $('.searchBox').focus(function() {
         $('#headerSearch').addClass('focus');
      })
      
      if ($('.searchBox').val() != '') {
          $('#headerSearch').addClass('focus');
       }      
      
   //CREATE SHADED BOXES WITH JS
    
  //  $('.shadeBox').wrapInner('<div class="shadeBoxContent" />').prepend('<div class="shadeBoxHead" />').append('</div><div class="shadeBoxFoot" />')

  
  
  //HOMEPAGE SLIDES
    
  var slideWidth = parseInt($('.slides').width()) //add 4 to account for css border;
  var slideNum = $('.slide').length;
  var selectorWidth = slideWidth / slideNum;
  var slideDuration = 5000
  
  
  $("ul.slidecontrols li").each( function() {
    $(this).append('<div class="loader"></div>');
    $(this).width(slideWidth / slideNum);
  })
  
  $('.loader').width(selectorWidth).css('right',selectorWidth);
  $('.slidecontrols .current .loader').css('background-color','#ff0000')

  
  // DOCUMENTATION IN FIREBUG
  // console.dir($(".slidecontrols").data("tabs"))
  
  var hovered = false;
  
  $(".slidecontrols").tabs(".slides > .slide", { 
 
        // enable "cross-fading" effect 
        effect: 'fade', 
        fadeOutSpeed: "200", 
 
        // start from the beginning after the last tab 
        rotate: true,
        onClick: function() {

          
        $('li .loader:not(.hovered)').each(function() {
         $(this).hide();
         });
        
        $('li.current .loader:not(.hovered)').css('right',selectorWidth).show().animate({
             right: 0
         }, {duration: slideDuration,easing:'linear'})//.fadeOut(100);
       },
        onPause: function() {
      
        },
         onPlay: function() {
        
        }
        

        
 
    // use the slideshow plugin. It accepts its own configuration 
    }).slideshow({
    autoplay: true,
    autopause: true,
    interval: slideDuration
    }
    );
  
    $(".slidecontrols li").hover(

       function() {
        //$('li.current .loader').stop().hide()
        $(this).find('.loader').stop().show().css('right',0)
        $(this).find('.loader').addClass('hovered')
        //make this active so loader knows not to reanimate onclick
        hovered = true
      
      },
      function() {
        $(this).find('.loader').hide().removeClass('hovered')
      // $('li.current .loader').stop().hide();
       // pause = false;
      }
    )
    
     $(".slideImgLink").hover(
      function() {
        $('li.current .loader').stop().css('right',0).show()
       // pause = true
      },
      function() {
      // $('li.current .loader').stop().hide();
       // pause = false;
      }
    ) 


    

// MAINTAIN FLOATED APPEARANCE FOR FLOATED 
// EDITABLE BLOCKS WHEN A USER CSS IS APPLIED (LIKE A BACKGROUND IMAGE)  
  
  $('.floatRightBox').each(function(){
    if ($(this).parent().hasClass('ccm-block-styles') == true) {
        var floatBoxClasses = $(this).attr('class')
        var $floatBoxParent = $(this).parent();
         $(this).removeClass();
         $floatBoxParent.addClass(floatBoxClasses);        
    }
  });
  
// MAINTAIN FLOATED APPEARANCE FOR FLOATED 
// EDITABLE BLOCKS WHEN IN EDIT MODE
// this needs to be run in a separate loop as the above function
  
  $('.floatRightBox').each(function(){
    if ($(this).parent().hasClass('ccm-block') == true) {
      $(this).parent().css('float', 'right');
      }
  });

 
//JQUERY TOOLS OVERLAY
  
	$(".sidebar .imgThumb[rel]").overlay({
    fixed: true,
    mask: {
		color: '#fff',
		loadSpeed: 200,
		opacity: 0.5
	},
  top: 'center',
	closeOnClick: true,
  onBeforeLoad:  function() {
          // ensure proper DOM placement
          this.getOverlay().appendTo('body');
          }
    
  
  });

  
  
  
  //STAFF PROFILES PAGE IMAGE CLONE 
  $('.userItem img').each(function(){
    $(this).addClass('bw').clone().appendTo($(this).parent()).removeClass('bw').addClass('color');
  })
  
   var preStaffLinkColor =  $('.userItemList li a').css('color');
   
  //HOVER OVER IMAGE HIGHLIGHT NAME
 		  $('img.bw').hover( 
          function() {
	         $(this).stop().animate({
              'opacity': 0
              }, 200)
           userItemClass = $(this).parent().attr('class');
           preStaffLinkHoverColor = $('.userItemList a[class$='+userItemClass+']').css('background-color')
           $('.userItemList a[class$='+userItemClass+']').stop().animate({ 
              color: '#fff',
              backgroundColor: '#333'
              }, 200);   
            },
          function() {
            $(this).stop().animate({
              'opacity': 1
            }, 200)
           $('.userItemList a[class$='+userItemClass+']').stop().animate({ 
              color: preStaffLinkColor,
              backgroundColor: preStaffLinkHoverColor
              }, 200);   
          })

  //HOVER OVER NAME HIGHLIGHT IMAGE
 		  $('.userItemList a').hover( 
          function() {
          userItemClass = $(this).attr('class');    
           $('.userItem .[class$='+userItemClass+'] img.bw').stop().animate({ 
              'opacity': 0
              }, 200);   
            //THIS TRIPLE PARENT THING IS NOT IDEAL
           preStaffLinkHoverColor = $(this).parent().parent().parent().css('background-color');   
           $(this).stop().animate({ 
              color: '#fff',
              backgroundColor: '#333'
              }, 200);   
            },
          function() {
            $('.userItem .[class$='+userItemClass+'] img.bw').stop().animate({ 
              'opacity': 1
              }, 200);   
           $(this).stop().animate({ 
              color: preStaffLinkColor,
              backgroundColor: preStaffLinkHoverColor
              }, 200);     
          });


  //SEARCH RESULTS CLASSES AND FORMATTING
          $('#searchResultsNav span').each(function(){
			// trim out whitespaces
			// add class name to non-current page numbers
		  });

	// TABS TEMPLATE
	$('ul.tabs').tabs('div.panes > div',{
      current: 'active'
   });
  $('div.panes div').equalHeights();
 

  
  
   });
      
      
 //REASSIGN A HREF TO DIV 
 
 $(function() {
      $('.jobListItem').click( function() {
            var $this = $(this);
            var href = $this.find('h3 a').attr('href');
            window.location = href
            return false;
      });
 });

