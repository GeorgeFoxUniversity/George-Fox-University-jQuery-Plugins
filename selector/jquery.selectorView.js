/**
 * jquery.selectorView.js 
 *
 * selectorView Plug-in
 * 
 * The GFU Custom selector plug-in.  Similar in concept to scrollable.
 *
 * Usage: 
 *
 *   You need to have an element that holds another element. That child element will
 *   have the items to scroll through in it.  The inner element needs to be long
 *   enough that all the items can be displayed in one line.
 *
 *   This inner element is what is moved and having the smaller element as its parent
 *   produces the scroll effect.
 *
 *   Setting are:
 *   
 *     items - selector for the parent element of the items to be scrolled
 *     selected - class to apply to the current selected element
 *     afterSelect - function to call after an element is selected 
 *
 *   Public methods are called by: $("element").selectorView('method', arguments)
 *
 *   Public methods are:
 *     
 *      - next: makes the next element selected
 *      - prev: makes the previous element selected
 *      - select: makes a given index of the item array current
 *      - seek: makes a given index of the item array visible
 *      - forward: scrolls forward the length of one element
 *      - back: scrolls backward the length of one element
 *      - data: returns the internal data object
 *
 *
 *   Sample CSS:
 *
 *        #thumbs 
 *        {
 *            position:relative;
 *            overflow:hidden;
 *            width: 600px;
 *            height:96px;
 *        }
 *
 *        #thumbs .items 
 *        {
 *            width:20000em;
 *            position:absolute;
 *        }
 *
 *        .items div 
 *        {
 *            float:left;
 *            margin-right: 10px;
 *        }
 *
 *
 * @author Joel Kelley <jkelley@georgefox.edu>
 * @version 0.01
 * @licence MIT
 */
(function( $ ){

    // Flag that controls if debug statements are printed.
    var doDebug = false;
       
        
    /**
     * Prints out a debug messages to console.log.  This allows just one flag
     * to be changed for the code to be ready for production, instead of
     * removing all the console.log statements.
     */
    function debug()
    {
        if( doDebug )
        {
            console.log( arguments );
        }

    }// End of debug


        
    /**
     * Prints out a debug messages to console.log.  This allows just one flag
     * to be changed for the code to be ready for production, instead of
     * removing all the console.log statements.
     */
    function log()
    {
        if( settings.log )
        {
            console.log( arguments );
        }

    }// End of Log



    /**
     * Defines the public methods of the plug-in. 
     *
     * Plug-in is initialized by $("element").selectorView( { key : value, ... } )
     * Functions are called by $("element").selectorView('method', arguments)
     *
     */
    var methods = {
        init : function( options ) { return _init_.apply(this, arguments);  },
        reset : function( ) { return _reset_.apply(this, arguments);  },
        next : function( ) { return _next_.apply(this, arguments); },
        prev : function( ) { return _prev_.apply(this, arguments); },
        seek : function( ) { return _seek_.apply(this, arguments); },
        select : function( ) { return _select_.apply(this, arguments); },
        forward : function( ) { return _forward_.apply(this, arguments); },
        back : function( ) { return _back_.apply(this, arguments); },
        data : function( ) { return data; }
    };


    
    /**
     * Holds data that is needed to control state and may prove
     * interesting/useful for a developer using this plug-in.
     *
     * current - the current element selected
     * visibleIndex - the index of the first visible element
     * index - the index of the current selected element
     * items - array holding the items to be scrolled
     * container - the inner container holding items to be scrolled 
     * itemsWidth - The sum of the outer width of all the items to be scrolled. 
     */
    var data = {
        current : null,
        visibleIndex : null,
        index : null,
        items : [],
        container : null,
        itemsWidth : null,
        windowWidth : null,
        lastSection: null,
        headOfLastSection: null
    }


   
    /**
     * Setting that may be passed in and control plug-in behavior.
     * 
     * items - selector for the parent element of the items to be scrolled
     * selected - class to apply to the current selected element
     * afterSelect - function to call after an element was selected 
     * afterSeek - function to call after an element was sought 
     * animate - options for animation, can accept a function to overide scrolling behavior 
     * speed - speed for default animation
     * log - log debug messages
     */
    var settings = {
        'items' : '.items',
        'selected' : 'selected',
        'afterSelect' : null,
        'afterSeek' : null,
        'animate' : 'default',
        'speed' : 'slow',
        'log' : false
    };



    /**
     * The "real" selectorView method.  Decides with method needs to be called.
     * 
     * $("element").selectorView(options) - calls init
     * $("element").selectorView(method, arguments) - calls a function with the given arguments
     *
     * @throws - exception if an undefined method is called
     */
    $.fn.selectorView = function( method )
    {
        if( methods[method] )
        {
            //Call normal methods pass on the arguments
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ) );
        }
        else if( typeof method == 'object' || ! method )
        {
            //Initialise if not other method name was passed
            return methods.init.apply( this, arguments );
        }
        else
        {
            // Throws and exception if an undefined method was called.
            $.error( 'Method ' + method + ' does not exist in jQuery.scrollView' );
        }
        
    }// Main called method



    /**
     * Initializes the selectorView plug-in and populates the data object
     * 
     * @options - {} see comments for settings
     *
     * @return - objects will an initialized selectorView plug-in instance
     */
    function _init_( options )
    {
        debug( this, arguments );

        // While it is odd to see a return statement at the start of a
        // function, it is required to keep jQuery chaining.
        return this.each(function()
        {
            //Merge options
            if( options )
            {
                $.extend( settings, options );
            }

            //Create a reference to the parent of the items to be scrolled through 
            data.container = $(this).children(settings.items); 
            log( data.container );       


            _reset_.apply(this);                       
             

    

            log( data );
        });
    
    } //End of _init_


    function _reset_()
    {
        
        log("Width of the window(" + data.windowWidth + ")  width of items(" +  data.itemsWidth + ")");
        
        /*
         * The general assumption is the first item in the holder div, is
         * the head for both the visible and selected lists
         */

        // The first child of the items container is made currently selected element
        data.current =  data.container.children(":first");
        $(data.current).addClass(settings.selected); //Add selected class to current
        
        //The first element is the start of the visible and selected lists
        data.visibleIndex = 0;
        data.index = 0;
        
        data.windowWidth = $(this).outerWidth();
    
        _buildItems_.apply(this);                       

        data.lastSection = data.itemsWidth - data.windowWidth
        log("Last section: " + data.lastSection);

        data.headOfLastSection = null;
        
        /* Find the head of the last viewable window
         * Also takes care of the case when the view window is larger then the
         * items width.  In other words index 0 is the head of the final
         * section.
         */
        $.each(data.items, function(index, value)
        {
            // Check item should be the start of the last view section
            if( data.headOfLastSection === null && $(this).data().selectorView.start > data.lastSection )
            {
                data.headOfLastSection = index;
                log("Last time to mark visible should be ", this);
            }

        }); // End of find last viewable index

    } // End of reset

    
    /**
     * Creates the internal items datastructer and calculates the width of the
     * all the items.
     */    
    function _buildItems_()
    {

        /* Calculate the combined outer width of the times to be scrolled.
         * This is needed to determine how far the container is to be
         * scrolled, to an extreme of the left of the container flush with
         * its parent div.
         *
         */
        data.itemsWidth = 0;
        data.items = [];

        /* Per item, makes a reference in data.items and adds its width to
         * data.itemsWidth
         */
        $(this).children(settings.items).children().each(function(index, value)
        {
            $(this).removeData('selectorView');

            $(this).data('selectorView', {start : data.itemsWidth, index: index});
            data.items.push(this);
            data.itemsWidth += $(this).outerWidth(true);
        });

    } // End of buildItems

      
   
    /**
     * Makes the previous item in the list selected, if not at the head of the
     * list.
     *
     * @return element the current element
     */ 
    function _prev_()
    {
         if( data.index != 0 )
         {
             return _select_.apply(this, [data.index - 1]); 
         }
    } //End of _prev_
 

    
    /**
     * Makes the next item in the list selected, if not at the tail of the
     * list.
     * 
     * @return element the current element
     */ 
    function _next_()
    {
        if( data.index != data.items.length - 1 )
        {
            return _select_.apply(this, [data.index + 1]); 
        }   

    } //End of _next_



    /**
     * Scrolls the list forward the length of one item, if not at end of scrollable area.
     * 
     * @return element the first visible element
     */
    function _forward_()
    {
        if( data.visibleIndex != data.items.length - 1 )
        {
            return _seek_.apply(this, [data.visibleIndex + 1]); 
        }   
    } //End of _forward_
  
  
 
    /**
     * Scrolls the list back the length of one item, if not at start of scrollable area.
     *
     * @return element the first visible element
     */
    function _back_()
    {
         if( data.visibleIndex != 0 )
         {   
             return _seek_.apply(this, [data.visibleIndex - 1]); 
         }

    } //End of _back_


    
    /* Scrolls the list until a given item is visible.  Normally the given item
     * will be scrolled to the start of the visible area.  If the end of the
     * item list is reached, the right edge will remain flush to the end of the
     * visible area.
     *
     * @param newIndex Integer the index of the item to be made visible
     * @param force the new item to be sought even if it seems to be the same index.  Useful after a reset.
      
     * @return element the first visible element
     */ 
    function _seek_(newIndex, force)
    {
        var sought = $(data.items[newIndex]);
        var move = 0;
        
        //Check the optional param force
        if( force === undefined )
        {
            force = false;
        }
        
        log( 'Current Index: ' + data.visibleIndex );
        log( 'Suggest New Index: ' + newIndex );
        log( 'Force is : ' + force ); 
        
        // Make sure the list does not get "stuck."  The pointer for visible
        // index should never go past what should be the first element in the
        // final full view section
        if( newIndex > data.headOfLastSection )
        {
            newIndex = data.headOfLastSection;
            sought = $(data.items[newIndex]);
        }
        
        log( 'Suggest Final Index: ' + newIndex );

        move = sought.data().selectorView.start;
        
        // Only If the visible index has really moved or you want to force it
        if(  data.visibleIndex != newIndex || force   )
        {
            log( 'Suggested offset to scroll: ' + move );
            
            // Scroll to the head of the last of visible section.
            // Don't scroll to the end if the items element is smaller then the container.
            if( move > data.lastSection && data.itemsWidth > data.windowWidth ) 
            {
                move = data.lastSection;
                log("Scrolling to the end of the list");
            }
            
            //Scroll to start of the new visible element
            _move_.apply(this, [move]);
            log("Scrolling " + move + " " + $(data.items[newIndex]).attr('id') );
           
            //Record the new visible index 
            data.visibleIndex = newIndex;

        }
        else
        {
            log("Did not move");
        }
        
        /**
         * Run the user provided function after new current item is ready.
         */
        if( settings.afterSeek != null )
        {
            settings.afterSeek.apply(data.current, [data])
        }

         
        return data.items[data.visibleIndex]; 
    } //End of _seek_

    
    function _move_(positionToScroll)
    {
        positionToScroll = positionToScroll * -1;
        log("In the move function", positionToScroll);
        
        if( settings.animate == 'default' )
        {
            $(data.container).animate({left: positionToScroll }, settings.speed);
        }
        else if( settings.animate === null )
        {
            $(data.container).css('left', positionToScroll);
        }
        else if( typeof(settings.animate) == 'function' )
        {
            settings.animate.apply(this, [positionToScroll]);
        }

    } //End of _move_

    /**
     * Make a given element the current item, with the selected class, and
     * scrolls it into view.
     *
     * @param newIndex integer item to be made current
     * @param force the new item to be sought even if it seems to be the same index.  Useful after a reset.
     *
     * @return current element the current item 
     */
    function _select_(newIndex, force)
    {
        
        //Remove the selected class from the old element
        $(data.current).removeClass( settings.selected );

        //Update current index
        data.current = data.items[newIndex];
        data.index = newIndex;
        
        //Add the selected class to the new current
        $(data.current).addClass( settings.selected );

        //Make sure the current element is visible
        _seek_.apply(this, [newIndex, force]);
        
        /**
         * Run the user provided function after new current item is ready.
         */
        if( settings.afterSelect != null )
        {
            settings.afterSelect.apply(data.current, [data])
        }
        
        return data.current;
    } //End of _select_


    function _outerWidth_(element)
    {
        var outer = new Object;
        var padding = new Object;
        var margin = new Object;
         
        element = $(element);
        log( element ); 
        padding.left = element.css('padding-left');
        log(padding.left);
        padding.left = padding.left.substr(0, padding.left.length - 2);
        padding.left = parseInt(padding.left, 10);
        
        return outer;
    }
     
   
})( jQuery );

