/*

  GalleryView - jQuery Content Gallery Plugin
  Author:     Jack Anderson
  Version:    1.1 (April 5, 2009)
  Documentation:   http://www.spaceforaname.com/jquery/galleryview/
  
  Please use this development script if you intend to make changes to the
  plugin code.  For production sites, please use jquery.galleryview-1.0.1-pack.js.
  
*/

(function($){
  $.fn.galleryView = function(options) {
    var opts = $.extend($.fn.galleryView.defaults,options);
    
    var id;
    var iterator = 0;
    var gallery_width;
    var gallery_height;
    var frame_margin = 10;
    var strip_width;
    var wrapper_width;
    var item_count = 0;
    var slide_method;
    var paused = false;
    var frame_caption_size = 20;
    var frame_margin_top = 5;
    var pointer_width = 2;
    
    //Define jQuery objects for reuse
    var j_gallery;
    var j_filmstrip;
    var j_frames;
    var j_panels;
    var j_pointer;
    
/************************************************/
/*  Plugin Methods                */
/************************************************/  
    function showItem(i) {
      //Disable next/prev buttons until transition is complete
      $('.nav-next').unbind('click');
      $('.nav-prev').unbind('click');
      j_frames.unbind('click');
      if(has_panels) {
        if(opts.fade_panels) {
          //Fade out all panels and fade in target panel
          j_panels.fadeOut(opts.transition_speed).eq(i%item_count).fadeIn(opts.transition_speed,function(){
            if(!has_filmstrip) {
              $('.nav-prev').click(showPrevItem);
              $('.nav-next').click(showNextItem);    
            }
          });
        } 
      }
      
      if(has_filmstrip) {
        //Slide either pointer or filmstrip, depending on transition method
        if(slide_method=='strip') {
          //Stop filmstrip if it's currently in motion
          j_filmstrip.stop();
          
          //Determine distance between pointer (eventual destination) and target frame
          var distance = getPos(j_frames[i]).left - (getPos(j_pointer[0]).left+2);
          var leftstr = (distance>=0?'-=':'+=')+Math.abs(distance)+'px';
          
          //Animate filmstrip and slide target frame under pointer
          //If target frame is a duplicate, jump back to 'original' frame
          j_filmstrip.animate({
            'left':leftstr
          },opts.transition_speed,opts.easing,function(){
            //Always ensure that there are a sufficient number of hidden frames on either
            //side of the filmstrip to avoid empty frames
            if(i>item_count) {
              i = i%item_count;
              iterator = i;
              j_filmstrip.css('left','-'+((opts.frame_width+frame_margin)*i)+'px');
            } else if (i<=(item_count-strip_size)) {
              i = (i%item_count)+item_count;
              iterator = i;
              j_filmstrip.css('left','-'+((opts.frame_width+frame_margin)*i)+'px');
            }
            
            if(!opts.fade_panels) {
              j_panels.hide().eq(i%item_count).show();
            }
            $('.nav-prev').click(showPrevItem);
            $('.nav-next').click(showNextItem);
            enableFrameClicking();
          });
        } else if(slide_method=='pointer') {
          //Stop pointer if it's currently in motion
          j_pointer.stop();
          //Get position of target frame
          var pos = getPos(j_frames[i]);
          //Slide the pointer over the target frame
          j_pointer.animate({
            'left':(pos.left-2+'px')
          },opts.transition_speed,opts.easing,function(){  
            if(!opts.fade_panels) {
              j_panels.hide().eq(i%item_count).show();
            }  
            $('.nav-prev').click(showPrevItem);
            $('.nav-next').click(showNextItem);
            enableFrameClicking();
          });
        }
      
        if($('a',j_frames[i])[0]) {
          j_pointer.unbind('click').click(function(){
            var a = $('a',j_frames[i]).eq(0);
            if(a.attr('target')=='_blank') {window.open(a.attr('href'));}
            else {location.href = a.attr('href');}
          });
        }
      }
    };
    function showNextItem() {
      $(document).stopTime("transition");
      if(++iterator==j_frames.length) {iterator=0;}
      showItem(iterator);
      $(document).everyTime(opts.transition_interval,"transition",function(){
        showNextItem();
      });
    };
    function showPrevItem() {
      $(document).stopTime("transition");
      if(--iterator<0) {iterator = item_count-1;}
      //alert(iterator);
      showItem(iterator);
      $(document).everyTime(opts.transition_interval,"transition",function(){
        showNextItem();
      });
    };
    function getPos(el) {
      var left = 0, top = 0;
      var el_id = el.id;
      if(el.offsetParent) {
        do {
          left += el.offsetLeft;
          top += el.offsetTop;
        } while(el = el.offsetParent);
      }
      //If we want the position of the gallery itself, return it
      if(el_id == id) {return {'left':left,'top':top};}
      //Otherwise, get position of element relative to gallery
      else {
        var gPos = getPos(j_gallery[0]);
        var gLeft = gPos.left;
        var gTop = gPos.top;
        
        return {'left':left-gLeft,'top':top-gTop};
      }
    };
    function enableFrameClicking() {
      j_frames.each(function(i){
        //If there isn't a link in this frame, set up frame to slide on click
        //Frames with links will handle themselves
        if($('a',this).length==0) {
          $(this).click(function(){
            $(document).stopTime("transition");
            showItem(i);
            iterator = i;
            $(document).everyTime(opts.transition_interval,"transition",function(){
              showNextItem();
            });
          });
        }
      });
    };
    
    function buildPanels() {
      //If there are panel captions, add overlay divs
      if($('.panel-overlay').length>0) {j_panels.append('<div class="overlay"></div>');}
      
      if(!has_filmstrip) {
        //Add navigation buttons        
        $('<div></div>').addClass('nav-overlay panel-next').appendTo(j_gallery).css({
          'position':'absolute',
          'zIndex':'12',
          'top':((opts.panel_height-22)/2)-10+'px',
          'right':'0',
          'display':'none'
        }).click(showPrevItem);;
        
        $('<div></div>').addClass('nav-overlay panel-prev').appendTo(j_gallery).css({
          'position':'absolute',
          'zIndex':'12',
          'top':((opts.panel_height-22)/2)-10+'px',
          'left':'0',
          'display':'none'
        }).click(showNextItem);;
      }
      j_panels.css({
        'width':(opts.panel_width-parseInt(j_panels.css('paddingLeft').split('px')[0],10)-parseInt(j_panels.css('paddingRight').split('px')[0],10))+'px',
        'height':(opts.panel_height-parseInt(j_panels.css('paddingTop').split('px')[0],10)-parseInt(j_panels.css('paddingBottom').split('px')[0],10))+'px',
        'position':'absolute',
        'top':(opts.filmstrip_position=='top'?(opts.frame_height+frame_margin_top+(opts.show_captions?frame_caption_size:frame_margin_top))+'px':'0px'),
        'left':'0px',
        'overflow':'hidden',
        'background':'white',
        'display':'none'
      });
      $('.panel-overlay',j_panels).css({
        'position':'absolute',
        'zIndex':'20',
        'width':(opts.panel_width-20)+'px',
        'height':opts.overlay_height+'px',
        'top':(opts.overlay_position=='top'?'0':opts.panel_height-opts.overlay_height+'px'),
        'left':'0',
        'padding':'0 10px'
      });
      $('.panel-overlay a',j_panels).css({
        'textDecoration':'underline',
        'fontWeight':'bold'
      });
      $('.overlay',j_panels).css({
        'position':'absolute',
        'zIndex':'19',
        'width':opts.panel_width+'px',
        'height':opts.overlay_height+'px',
        'top':(opts.overlay_position=='top'?'0':opts.panel_height-opts.overlay_height+'px'),
        'left':'0',
        'opacity':opts.overlay_opacity
      });
      $('.panel iframe',j_panels).css({
        'width':opts.panel_width+'px',
        'height':(opts.panel_height-opts.overlay_height)+'px',
        'border':'0'
      });
    };
    
    function buildFilmstrip() {
      //Add wrapper to filmstrip to hide extra frames
      j_filmstrip.wrap('<div class="strip_wrapper"></div>');
      if(slide_method=='strip') {
        j_frames.clone().appendTo(j_filmstrip);
        j_frames.clone().appendTo(j_filmstrip);
        j_frames = $('li',j_filmstrip);
      }
      //If captions are enabled, add caption divs and fill with the image titles
      if(opts.show_captions) {
        j_frames.append('<div class="caption"></div>').each(function(i){
          $(this).find('.caption').html($(this).find('img').attr('title'));         
        });
      }
      
      j_filmstrip.css({
        'listStyle':'none',
        'margin':'0',
        'padding':'0',
        'width':strip_width+'px',
        'position':'absolute',
        'zIndex':'17',
        'top':'0',
        'left':'0',
        'height':(opts.frame_height+10)+'px'
        //'background':opts.background_color
      });
      j_frames.css({
        'float':'left',
        'position':'relative',
        'height':opts.frame_height+'px',
        'zIndex':'16',
        'marginTop':frame_margin_top+'px',
        'marginBottom':'0px',
        'marginRight':frame_margin+'px',
        'padding':'0',
        'cursor':'pointer'
      });
      $('img',j_frames).css({
        'border':'none'
      });
      $('.strip_wrapper',j_gallery).css({
        'position':'absolute',
        'top':(opts.filmstrip_position=='top'?'0px':opts.panel_height+'px'),
        'left':((gallery_width-wrapper_width)/2)+'px',
        'width':wrapper_width+'px',
        'height':(opts.frame_height+frame_margin_top+(opts.show_captions?frame_caption_size:frame_margin_top))+'px',
        'overflow':'hidden'
      });
      $('.caption',j_gallery).css({
        'position':'absolute',
        'top':opts.frame_height+'px',
        'left':'0',
        'margin':'0',
        'width':opts.frame_width+'px',
        'padding':'0',
        'textAlign':'center',
        'fontSize':'10px',
        'height':frame_caption_size+'px',
        
        'lineHeight':frame_caption_size+'px'
      });
      var pointer = $('<div></div>');
      pointer.attr('id','pointer').appendTo(j_gallery).css({
         'position':'absolute',
         'zIndex':'21',
         'cursor':'pointer',
         'top':getPos(j_frames[0]).top-(pointer_width/2)+'px',
         'left':getPos(j_frames[0]).left-(pointer_width/2)+'px',
         'height':opts.frame_height-pointer_width+'px',
         'width':opts.frame_width-pointer_width+'px',
         'border':(has_panels?pointer_width+'px solid '+(opts.nav_theme=='dark'?'black':'white'):'none')
      });
      j_pointer = $('#pointer',j_gallery);
      if(has_panels) {
        var pointerArrow = $('<div></div>');
        pointerArrow.appendTo($('#pointer')).css({
          'position':'absolute',
          'zIndex':'22',
          'top':(opts.filmstrip_position=='bottom'?'-'+(10+pointer_width)+'px':opts.frame_height+'px'),
          'left':((opts.frame_width/2)-10)+'px'
        })
        .addClass('pointer_img');
      }
      
      //If the filmstrip is animating, move the strip to the middle third
      if(slide_method=='strip') {
        j_filmstrip.css('left','-'+((opts.frame_width+frame_margin)*item_count)+'px');
        iterator = item_count;
      }
      //If there's a link under the pointer, enable clicking on the pointer
      if($('a',j_frames[iterator])[0]) {
        j_pointer.click(function(){
          var a = $('a',j_frames[iterator]).eq(0);
          if(a.attr('target')=='_blank') {window.open(a.attr('href'));}
          else {location.href = a.attr('href');}
        });
      }
      
      //Add navigation buttons
      $('<div></div>').addClass('nav-next').appendTo(j_gallery).css({
        'position':'absolute',
        'cursor':'pointer',
        'top':(opts.filmstrip_position=='top'?0:opts.panel_height)+frame_margin_top+((opts.frame_height-22)/2)+'px',
        'right':(gallery_width/2)-(wrapper_width/2)-10-22+'px'
      }).click(showNextItem);
      $('<div></div>').addClass('nav-prev').appendTo(j_gallery).css({
        'position':'absolute',
        'cursor':'pointer',
        'top':(opts.filmstrip_position=='top'?0:opts.panel_height)+frame_margin_top+((opts.frame_height-22)/2)+'px',
        'left':(gallery_width/2)-(wrapper_width/2)-10-22+'px'
      }).click(showPrevItem);
    };
    
    //Check mouse to see if it is within the borders of the panel
    //More reliable than 'mouseover' event when elements overlay the panel
    function mouseIsOverPanels(x,y) {    
      var pos = getPos(j_gallery[0]);
      var top = pos.top;
      var left = pos.left;
      return x > left && x < left+opts.panel_width && y > top && y < top+opts.panel_height;        
    };
    
/************************************************/
/*  Main Plugin Code              */
/************************************************/
    return this.each(function() {
      j_gallery = $(this);
      
      //Hide gallery to prevent Flash of Unstyled Content (FoUC) in IE
      j_gallery.css('visibility','hidden');
      
      //Assign elements to variables for reuse
      j_filmstrip = $('.filmstrip',j_gallery);
      j_frames = $('li',j_filmstrip);
      j_panels = $('.panel',j_gallery);
      
      id = j_gallery.attr('id');
      
      has_panels = j_panels.length > 0;
      has_filmstrip = j_frames.length > 0;
      
      if(!has_panels) opts.panel_height = 0;
      
      //Number of frames in filmstrip
      item_count = has_panels?j_panels.length:j_frames.length;
      
      //Number of frames that can display within the screen's width
      //64 = width of block for navigation button * 2
      //5 = minimum frame margin
      strip_size = has_panels?Math.floor((opts.panel_width-64)/(opts.frame_width+frame_margin)):Math.min(item_count,opts.filmstrip_size); 
      
      
      /************************************************/
      /*  Determine transition method for filmstrip  */
      /************************************************/
          //If more items than strip size, slide filmstrip
          //Otherwise, slide pointer
          if(strip_size >= item_count) {
            slide_method = 'pointer';
            strip_size = item_count;
          }
          else {slide_method = 'strip';}
      
      /************************************************/
      /*  Determine dimensions of various elements  */
      /************************************************/
          
          //Width of gallery block
          gallery_width = has_panels?opts.panel_width:(strip_size*(opts.frame_width+frame_margin))-frame_margin+64;
          
          //Height of gallery block = screen + filmstrip + captions (optional)
          gallery_height = (has_panels?opts.panel_height:0)+(has_filmstrip?opts.frame_height+frame_margin_top+(opts.show_captions?frame_caption_size:frame_margin_top):0);
          
          //Width of filmstrip
          if(slide_method == 'pointer') {strip_width = (opts.frame_width*item_count)+(frame_margin*(item_count));}
          else {strip_width = (opts.frame_width*item_count*3)+(frame_margin*(item_count*3));}
          
          //Width of filmstrip wrapper (to hide overflow)
          wrapper_width = ((strip_size*opts.frame_width)+((strip_size-1)*frame_margin));
      
      /************************************************/
      /*  Apply CSS Styles              */
      /************************************************/
          j_gallery.css({
            'position':'relative',
            //'background':opts.background_color,
            //'border':opts.border,
            'width':gallery_width+'px',
            'height':gallery_height+'px'
          });
      
      /************************************************/
      /*  Build filmstrip and/or panels        */
      /************************************************/
          if(has_filmstrip) {
            buildFilmstrip();
          }
          if(has_panels) {
            buildPanels();
          }

      
      /************************************************/
      /*  Add events to various elements        */
      /************************************************/
          if(has_filmstrip) enableFrameClicking();
          
            
            
            $().mousemove(function(e){              
              if(mouseIsOverPanels(e.pageX,e.pageY)) {
                if(opts.pause_on_hover) {
                  $(document).oneTime(500,"animation_pause",function(){
                    $(document).stopTime("transition");
                    paused=true;
                  });
                }
                if(has_panels && !has_filmstrip) {
                  $('.nav-overlay').fadeIn('fast');
                  $('.nav-next').fadeIn('fast');
                  $('.nav-prev').fadeIn('fast');
                }
              } else {
                if(opts.pause_on_hover) {
                  $(document).stopTime("animation_pause");
                  if(paused) {
                    $(document).everyTime(opts.transition_interval,"transition",function(){
                      showNextItem();
                    });
                    paused = false;
                  }
                }
                if(has_panels && !has_filmstrip) {
                  $('.nav-overlay').fadeOut('fast');
                  $('.nav-next').fadeOut('fast');
                  $('.nav-prev').fadeOut('fast');
                }
              }
            });
      
      
      /************************************************/
      /*  Initiate Automated Animation        */
      /************************************************/
          //Show the first panel
          j_panels.eq(0).show();

          //If we have more than one item, begin automated transitions
          if(item_count > 1) {
            $(document).everyTime(opts.transition_interval,"transition",function(){
              showNextItem();
            });
          }
          
          //Make gallery visible now that work is complete
          j_gallery.css('visibility','visible');
    });
  };
  
  $.fn.galleryView.defaults = {
    panel_width: 400,
    panel_height: 300,
    frame_width: 80,
    frame_height: 80,
    filmstrip_size: 3,
    overlay_height: 70,
    overlay_font_size: '1em',
    transition_speed: 400,
    transition_interval: 6000,
    overlay_opacity: 0.6,
    overlay_color: 'black',
    background_color: 'black',
    overlay_text_color: 'white',
    caption_text_color: 'white',
    border: '1px solid black',
    nav_theme: 'light',
    easing: 'swing',
    filmstrip_position: 'bottom',
    overlay_position: 'bottom',
    show_captions: false,
    fade_panels: true,
    pause_on_hover: false
  };
})(jQuery);





/**
 * jQuery.timers - Timer abstractions for jQuery
 * Written by Blair Mitchelmore (blair DOT mitchelmore AT gmail DOT com)
 * Licensed under the WTFPL (http://sam.zoy.org/wtfpl/).
 * Date: 2009/02/08
 *
 * @author Blair Mitchelmore
 * @version 1.1.2
 *
 **/

jQuery.fn.extend({
  everyTime: function(interval, label, fn, times, belay) {
    return this.each(function() {
      jQuery.timer.add(this, interval, label, fn, times, belay);
    });
  },
  oneTime: function(interval, label, fn) {
    return this.each(function() {
      jQuery.timer.add(this, interval, label, fn, 1);
    });
  },
  stopTime: function(label, fn) {
    return this.each(function() {
      jQuery.timer.remove(this, label, fn);
    });
  }
});

jQuery.event.special

jQuery.extend({
  timer: {
    global: [],
    guid: 1,
    dataKey: "jQuery.timer",
    regex: /^([0-9]+(?:\.[0-9]*)?)\s*(.*s)?$/,
    powers: {
      // Yeah this is major overkill...
      'ms': 1,
      'cs': 10,
      'ds': 100,
      's': 1000,
      'das': 10000,
      'hs': 100000,
      'ks': 1000000
    },
    timeParse: function(value) {
      if (value == undefined || value == null)
        return null;
      var result = this.regex.exec(jQuery.trim(value.toString()));
      if (result[2]) {
        var num = parseFloat(result[1]);
        var mult = this.powers[result[2]] || 1;
        return num * mult;
      } else {
        return value;
      }
    },
    add: function(element, interval, label, fn, times, belay) {
      var counter = 0;
      
      if (jQuery.isFunction(label)) {
        if (!times) 
          times = fn;
        fn = label;
        label = interval;
      }
      
      interval = jQuery.timer.timeParse(interval);

      if (typeof interval != 'number' || isNaN(interval) || interval <= 0)
        return;

      if (times && times.constructor != Number) {
        belay = !!times;
        times = 0;
      }
      
      times = times || 0;
      belay = belay || false;
      
      var timers = jQuery.data(element, this.dataKey) || jQuery.data(element, this.dataKey, {});
      
      if (!timers[label])
        timers[label] = {};
      
      fn.timerID = fn.timerID || this.guid++;
      
      var handler = function() {
        if (belay && this.inProgress) 
          return;
        this.inProgress = true;
        if ((++counter > times && times !== 0) || fn.call(element, counter) === false)
          jQuery.timer.remove(element, label, fn);
        this.inProgress = false;
      };
      
      handler.timerID = fn.timerID;
      
      if (!timers[label][fn.timerID])
        timers[label][fn.timerID] = window.setInterval(handler,interval);
      
      this.global.push( element );
      
    },
    remove: function(element, label, fn) {
      var timers = jQuery.data(element, this.dataKey), ret;
      
      if ( timers ) {
        
        if (!label) {
          for ( label in timers )
            this.remove(element, label, fn);
        } else if ( timers[label] ) {
          if ( fn ) {
            if ( fn.timerID ) {
              window.clearInterval(timers[label][fn.timerID]);
              delete timers[label][fn.timerID];
            }
          } else {
            for ( var fn in timers[label] ) {
              window.clearInterval(timers[label][fn]);
              delete timers[label][fn];
            }
          }
          
          for ( ret in timers[label] ) break;
          if ( !ret ) {
            ret = null;
            delete timers[label];
          }
        }
        
        for ( ret in timers ) break;
        if ( !ret ) 
          jQuery.removeData(element, this.dataKey);
      }
    }
  }
});

jQuery(window).bind("unload", function() {
  jQuery.each(jQuery.timer.global, function(index, item) {
    jQuery.timer.remove(item);
  });
});