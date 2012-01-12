/*
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
     * Defines the public methods of the plug-in. 
     *
     * Plug-in is initialized by $("element").gfuMenu( { key : value, ... } )
     * Functions are called by $("element").gfuMenu('method', arguments)
     *
     */
    var methods = {
        init : function( options ) { return _init_.apply(this, arguments);  },
        scroll : function( ) { return _scroll_.apply(this, arguments);  },
        data : function( ) { return data; }
    };


    
    /**
     * Holds data that is needed to control state and may prove
     * interesting/useful for a developer using this plug-in.
     */
    var defaultData = {
        realMenu: null,
        nav : null,
        view : null,
        menu : null 
    }


   
    /**
     * Setting that may be passed in and control plug-in behavior.
     * 
     */
    var defaultSettings = {
        subMenuTitle :'span:first',
        subMenu : 'ul:first',
        rootTitle: 'Menu',
        current : null,
        up : null,
        down : null,
        holderSelector: null,
        itemClick : null,
        afterSubMenu : null 
    };



    /**
     * The "real" selectorView method.  Decides with method needs to be called.
     * 
     * $("element").selectorView(options) - calls init
     * $("element").selectorView(method, arguments) - calls a function with the given arguments
     *
     * @throws - exception if an undefined method is called
     */
    $.fn.gfuMenu = function( method )
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
            $.error( 'Method ' + method + ' does not exist in jQuery.gfuMenu' );
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
            // Mark the real menu so it is easy to access
            $(this).addClass('gfu-menu-user');
            
            // Store all instance data on the menu element.
            $(this).data('gfuMenu', { settings : {}, data : {} }) 
            
            // Reference data and settings to sorter name
            var settings = $(this).data('gfuMenu').settings
            var data = $(this).data('gfuMenu').data
            
            // Set default values for data and settings 
            $.extend( settings, defaultSettings );
            $.extend( data, defaultData );
             
            //Merge options
            if( options )
            {
                $.extend( settings, options );
            }
            
            // Keep track of the real menu for refrence 
            data.realMenu = $(this);
            
            // Nav stack for drill down
            data.nav = [];
            
            if( settings.holderSelector === null )
            {
                // Create a new container for gfuMenu view
                data.view = $('<div class="gfu-menu-holder"></div>');
                data.realMenu.before(data.view);
            }
            else
            {
                data.view = $(settings.holderSelector);
                data.view.addClass("gfu-menu-holder");
            }
            

            // Create the place for menu items to go
            data.menu = $('<div class="gfu-menu"></div>'); 
            data.view.append(data.menu);
            
            // Make sure the menu always has a reference to the data object as well.
            data.menu.data('gfuMenu', { real : this })    
             
            
            //If we don't have to fast forward in the menu 
            if( settings.current == null || $(".selected").parentsUntil('div.gfu-menu-holder').length == 0 )
            {
                _buildMenu_.apply(this, [data.realMenu, settings.rootTitle]);                       
            }
            else
            {
                

                
                // Fill stack
                $(settings.current).parentsUntil('div.gfu-menu-holder').each(function()
                {
                    if( $(this).is('li') )
                    {
                        var parentMenu = {};
                        parentMenu.title = $(this).children(settings.subMenuTitle).text();
                        parentMenu.menu = $(this).children('ul:first');
                        
                        data.nav.unshift(parentMenu);
                        
                        debug( this ); 
                    }
                
                });
                //Put the root menu at the head of nav
                var root = {};
                root.title = settings.rootTitle;
                root.menu = data.realMenu;
                data.nav.unshift(root);
                
                var title = $(settings.current).children(settings.subMenuTitle).text();
                var subMenu = $(settings.current).children('ul:first'); 
                 
                _buildMenu_.apply(this, [subMenu, title]);                       
            
            }
             

            // Title Nav event
            $(data.menu).delegate('div.gfu-menu-title', 'click', _buildMenuFromTitle_);

            debug( data );
        });
    
    } //End of _init_


    function _buildMenu_(list, title)
    {

        // Reference data and settings to sorter name
        var settings = $(this).data('gfuMenu').settings
        var data = $(this).data('gfuMenu').data

        data.menu.empty();
        
        // Create the title area of the menu
        data.menu.append('<div class="gfu-menu-title">' + title + '</div>');
        
        // Check if title is the root title
        if( data.nav.length == 0 )
        {
            data.menu.children('div.gfu-menu-title').addClass('gfu-menu-title-root');
        }
        else
        {
            data.menu.children('div.gfu-menu-title').removeClass('gfu-menu-title-root');
        }
         
        $(list).children('li').each(function()
        {
            // Create the entry item
            var item = $('<div class="gfu-menu-item"></div>');
            
            // Add a reference to the "real" menu item
            item.data('gfuMenu', {real : this});

            if( $(this).children('ul').length != 0 )
            {
                item.addClass('gfu-menu-sub');
                item.text( $(this).children('span').text() );
                item.click(_subMenuClick_);
            }
            else
            {
                item.text( $(this).text() );
                item.click(_itemClick_);
            }
            
            // Add the new item to the menu inside the plugin view     
            data.menu.append(item);    
        
        });
       
        //reset scroll stuff
        if( $(data.menu).height() < $(data.view).height() )
        {
            debug('hide');
            if(settings.up != null )
            {
                $(settings.up).hide();
            }

            if(settings.down != null )
            {
                $(settings.down).hide();
            }
        }
        else // big enough window to scroll
        {
            //Still hide top scroll button by default
            if(settings.up != null )
            {
                $(settings.up).hide();
            }
            
            if(settings.down != null )
            {
                $(settings.down).show();
            }

        }

        data.menu.css('top', '0px');

    } // End of buidMenu


    function _subMenuClick_(event)
    {   
       

        var subMenu = [];

        // Real list item that corresponds to our entry in the view
        var real = $(this).data('gfuMenu').real;
       
        // Plugin data store
        var data = $(real).parents('.gfu-menu-user').data('gfuMenu').data
        var settings = $(real).parents('.gfu-menu-user').data('gfuMenu').settings

        // Save navigation information
        last = {}
        last['title'] = data.menu.children('div.gfu-menu-title').text()
        last['menu'] = last['menu'] = $(real).closest('ul'); // Parent of the item clicked
        
        // Push the last view onto the nav stack
        data.nav.push(last);
        debug('Adding to stack: ', last );
        
        //Update the title of the menu
        title =  $(real).children(settings.subMenuTitle).text();
        
        subMenu = $(real).children(settings.subMenu);
        
        _buildMenu_.apply(data.realMenu, [subMenu, title]);

        if( settings.afterSubMenu !== null )
        {
            settings.afterSubMenu.apply(this, [real]);
        }
    }

    /**
     * Called when normal list item is clicked.  Normal means that it does not
     * contain a submenu.
     *
     * @param event special DOM event for clicked element
     */ 
    function _itemClick_(event)
    {
        // Reference to the original html menu item.
        real = $(this).data('gfuMenu').real;

        if( settings.itemClick !== null )
        {
            // If itemClick was set, run that function and pass it the 'real' list item.
            settings.itemClick.apply(this, [real]);
        }
        else if( $(real).children('a:first') )
        {
            // If itemClick was not set, go to the href of the first link.
            window.location = $(real).children('a:first').attr('href');
        }

    } // End of _itemClick_
    
    
    function _buildMenuFromTitle_(event)
    {
        console.log( arguments )
        var realMenu = $(this).parent('.gfu-menu').data('gfuMenu').real; 
        
        var data = $(realMenu).data('gfuMenu').data;
        var settings = $(realMenu).data('gfuMenu').settings;
         
        if( data.nav.length > 0 )
        {
            var prev = data.nav.pop();
            debug( prev );

            //If we are back to the root, use the root title and class
            if( data.nav.length == 0 )
            {
                prev.title = settings.rootTitle;
            }
            
            _buildMenu_.apply(data.realMenu, [prev.menu, prev.title]);   
        }

    }

    function _scroll_(distance, direction)
    {


        // Reference data and settings to sorter name
        var settings = $(this).data('gfuMenu').settings
        var data = $(this).data('gfuMenu').data


        // Get the current position of the menu
        var currentTop = $(data.menu).css('top');
        var diffrence =  $(data.view).height() - $(data.menu).height();
        
        var move = true;
        var newTop = -1;
         
        debug("Top of scroll function");
        
        if( currentTop == 'auto' )
        {
            currentTop = 0;
        }
        else
        {
            currentTop = currentTop.substring(0, currentTop.length - 2)
            currentTop = parseInt(currentTop, 10);
        }
        

        /* Check to see if the menu panel should move
         */
        if( $(data.menu).height() < $(data.view).height() || // menu to small for scrolling to make sense
            currentTop < diffrence && direction == 'down' || // if all the "lower" content is shown
            currentTop == 0 && direction == 'up'  // if we are at the "top" of the list going down
          )
        {
             move = false;
        }

        debug('Move is: ', move);
        
        // If we overshot the top of the list
        if( currentTop > 0 && direction == 'up' )
        {
            debug("Over shot");
            $(data.menu).animate({top : 0}, 'slow');
        }
        else if( move )
        {
            debug("Scroll!");
            
            // Do the right math for up (+) and down (-)
            if( direction == 'down' )
            {
                newTop = currentTop - distance;
                
                // don't go bellow the bottom of the list
                if( newTop < ( $(data.menu).height() - $(data.view).height() ) * -1 )
                {
                    newTop = ( $(data.menu).height() - $(data.view).height() ) * -1;
                }

            }
            else if( direction == 'up' )
            {
                newTop = currentTop + distance;

                if( newTop > 0 )
                {
                    newTop = 0;
                }
            }

            

            //Scroll!
            $(data.menu).animate({top : newTop }, 'slow');
        }
        
        
        // Up and down button hide and show 
        if( newTop >= 0 )
        {
            $(settings.up).hide();
        }
        else
        {
            $(settings.up).show();
        }

        if( newTop <= ( $(data.menu).height() - $(data.view).height() ) * -1 )
        {
            $(settings.down).hide();
        }
        else
        {
            $(settings.down).show();
        }

        
        debug( newTop );
        debug( currentTop );
    }
   
})( jQuery );

