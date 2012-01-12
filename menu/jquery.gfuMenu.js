/* A drill down menu plug-in created by the Marketing and Communication Department of George Fox University.  
 *
 * We needed an easy to theme drill down menu for our course catalog.  As none
 * of the existing options did exactly what we needed, we rolled our own.
 *
 * 
 *
 * @author Joel Kelley <jkelley@georgefox.edu>
 * @version 0.5
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
        data : function( ) { return $(this).data('gfuMenu').data; }

    }; // end of methods declaration


    
    /**
     * Template for plug-in's widely used data object.
     *
     * Holds data that is needed to control state and may prove
     * interesting/useful for a developer using this plug-in.
     */
    var defaultData = {

        realMenu: null,
        nav : null,
        view : null,
        menu : null 

    } // End of default data template


   
    /**
     * Default setting for the plugin.  They can all be overridden when the
     * plug-in is initialized.
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

    }; // End of default settings



    /**
     * The "real" gfuMenu method.  Decides with method needs to be called.
     * 
     * $("element").gfuMenu(options) - calls init
     * $("element").gfuMenu(method, arguments) - calls a function with the given arguments
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
     * Initializes the gfuMenu plug-in and populates the data object
     * 
     * @options - {} see comments for settings
     *
     * @return - objects will an initialized gfuMenu plug-in instance
     */
    function _init_( options )
    {
        debug( this, arguments );

        // Make sure chaining works
        return this.each(function()
        {
            
            /* Prepare our data object that will be attached the element the
             * plug-in is called on.
             * 
             * The default data template added after settings because I do not
             * want the user to be able to give them a starting value.
             */
            var data = $.extend( {}, defaultSettings );
            
            //Merge user options with settings
            if( options )
            {
                $.extend( data, options );
            }

            // Add the default data template
            $.extend( data, defaultData );
            

            $(this).addClass('gfu-menu-user'); // Mark the real menu so it is easy to access
            $(this).data('gfuMenu', { data : data }) // Create a local data/settings store

            
            
            /**
             * Data attributes
             */
            data.realMenu = $(this); // The user supplied menu
            data.nav = []; // Navigation stack
            data.menu = $('<div class="gfu-menu"></div>'); // The gfuMenu
            
            /**
             * The div to display the gfuMenu and scroll
             */ 
            if( data.holderSelector === null )
            {
                // Create a new container for gfuMenu view
                data.view = $('<div class="gfu-menu-holder"></div>');
                data.realMenu.before(data.view);
            }
            else
            {
                data.view = $(data.holderSelector);
                data.view.addClass("gfu-menu-holder");
            }
            
            // Put the window in the view; 
            data.view.append(data.menu);
           
            
            // Make sure the menu always has a reference to the data object as well.
            data.menu.data('gfuMenu', { real : this })    
             
            
            //If we don't have to fast forward in the menu 
            if( data.current == null || $(".selected").parentsUntil('div.gfu-menu-holder').length == 0 )
            {
                _buildMenu_.apply(this, [data.realMenu, data.rootTitle]);                       
            }
            else
            {
                

                
                // Fill stack
                $(data.current).parentsUntil('div.gfu-menu-holder').each(function()
                {
                    if( $(this).is('li') )
                    {
                        var parentMenu = {};
                        parentMenu.title = $(this).children(data.subMenuTitle).text();
                        parentMenu.menu = $(this).children('ul:first');
                        
                        data.nav.unshift(parentMenu);
                        
                        debug( this ); 
                    }
                
                });
                //Put the root menu at the head of nav
                var root = {};
                root.title = data.rootTitle;
                root.menu = data.realMenu;
                data.nav.unshift(root);
                
                var title = $(data.current).children(data.subMenuTitle).text();
                var subMenu = $(data.current).children('ul:first'); 
                 
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
            if(data.up != null )
            {
                $(data.up).hide();
            }

            if(data.down != null )
            {
                $(data.down).hide();
            }
        }
        else // big enough window to scroll
        {
            //Still hide top scroll button by default
            if(data.up != null )
            {
                $(data.up).hide();
            }
            
            if(data.down != null )
            {
                $(data.down).show();
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

        // Save navigation information
        last = {}
        last['title'] = data.menu.children('div.gfu-menu-title').text()
        last['menu'] = last['menu'] = $(real).closest('ul'); // Parent of the item clicked
        
        // Push the last view onto the nav stack
        data.nav.push(last);
        debug('Adding to stack: ', last );
        
        //Update the title of the menu
        title =  $(real).children(data.subMenuTitle).text();
        
        subMenu = $(real).children(data.subMenu);
        
        _buildMenu_.apply(data.realMenu, [subMenu, title]);

        if( data.afterSubMenu !== null )
        {
            data.afterSubMenu.apply(this, [real]);
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
 
        var data = $(real).parents('.gfu-menu-user').data('gfuMenu').data;
         
        if( data.itemClick !== null )
        {
            // If itemClick was set, run that function and pass it the 'real' list item.
            data.itemClick.apply(this, [real]);
        }
        else if( $(real).children('a:first') )
        {
            // If itemClick was not set, go to the href of the first link.
            window.location = $(real).children('a:first').attr('href');
        }

    } // End of _itemClick_
    
     
    function _buildMenuFromTitle_(event)
    {
        var realMenu = $(this).parent('.gfu-menu').data('gfuMenu').real; 
        
        var data = $(realMenu).data('gfuMenu').data;
         
        if( data.nav.length > 0 )
        {
            var prev = data.nav.pop();
            debug( prev );

            //If we are back to the root, use the root title and class
            if( data.nav.length == 0 )
            {
                prev.title = data.rootTitle;
            }
            
            _buildMenu_.apply(data.realMenu, [prev.menu, prev.title]);   
        }

    }

    function _scroll_(distance, direction)
    {

        // Reference data and settings to sorter name
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
            $(data.up).hide();
        }
        else
        {
            $(data.up).show();
        }

        if( newTop <= ( $(data.menu).height() - $(data.view).height() ) * -1 )
        {
            $(data.down).hide();
        }
        else
        {
            $(data.down).show();
        }

        
        debug( newTop );
        debug( currentTop );
    }
   
})( jQuery );

