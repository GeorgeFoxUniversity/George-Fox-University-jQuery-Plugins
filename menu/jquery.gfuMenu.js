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
        fastForward : null,
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
            $(this).hide(); // Hide the user supplied menu
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
             
            
            // Check to see if the menu needs fast forwarded 
            if( data.fastForward == null || $( data.fastForward ).parentsUntil('div.gfu-menu-holder').length == 0 )
            {
                // Build the root menu
                _buildMenu_.apply(this, [data.realMenu, data.rootTitle]);                       
            }
            else
            {
                /**
                 * Fast forward the menu
                 */
                 
                var title = $(data.fastForward).children(data.subMenuTitle).text();
                var subMenu = $(data.fastForward).children('ul:first'); 
                
                // Fill the nav stack as fill the sub menu we wanted was clicked to 
                $(data.fastForward).parentsUntil('div.gfu-menu-holder').each(function()
                {
                    if( $(this).is('li') )
                    {
                        var parentMenu = {};
                        parentMenu.title = $(this).children(data.subMenuTitle).text();
                        parentMenu.menu = $(this).children('ul:first');
                        
                        data.nav.unshift(parentMenu);
                        
                        debug( this ); 
                    }
                
                }); // end of fill the stack

                //Put the root menu at the head of nav
                data.nav.unshift( {title: data.rootTitle, menu: data.realMenu} );
                
                // Build the sub menu the plug-in caller wanted loaded first                  
                _buildMenu_.apply(this, [subMenu, title]);                       
            
            } // End of go to the current select submenu
             

            // When the title of the menu is clicked on, move up one level
            $(data.menu).delegate('div.gfu-menu-title', 'click', _buildMenuFromTitle_);

            debug( data );
        });
    
    } //End of _init_

        
    /*********************************
     * Utility Functions
     *********************************/
   
    /**
     * Build the view for the current section of the menu
     *
     * @param list - html unordered list
     * @param title - title of the current menu section
     */
    function _buildMenu_(list, title)
    {
        // Reference data and settings to sorter name
        var data = $(this).data('gfuMenu').data

        var titleHtml = $('<div class="gfu-menu-title">' + title + '</div>'); //Create the title object
        titleHtml.data('gfuMenu', { data : data } ); // Attach data reference to the title
        
        
        data.menu.empty(); // Clear the existing view
        
        data.menu.append(titleHtml); // Create the title area of the menu
        
        // Add or remove a class to indicate the we are on the root view/title
        if( data.nav.length == 0 )
        {
            data.menu.children('div.gfu-menu-title').addClass('gfu-menu-title-root');
        }
        else
        {
            data.menu.children('div.gfu-menu-title').removeClass('gfu-menu-title-root');
        } // end of make sure the title has the right class
        
        
        // Create an entry in gfu menu for each item in the user menu
        $(list).children('li').each(function()
        {
            // Create the entry item
            var item = $('<div class="gfu-menu-item"></div>');
            
            // Add a reference to the "real" menu item and the data object
            item.data('gfuMenu', {real : this, data : data});

            if( $(this).children('ul').length != 0 ) // Create submenu entry
            {
                item.addClass('gfu-menu-sub');
                item.text( $(this).children('span').text() );
                item.click(_subMenuClick_);
            }
            else // Create normal entry
            {
                item.text( $(this).text() );
                item.click(_itemClick_);
            }
            
            // Add the new item to the menu inside the plugin view     
            data.menu.append(item);    
        
        }); // End of populate view from user menu

        
        
        data.menu.css('top', '0px'); // Make sure menu is scrolled all the way up.
        _updateButtonState_(0, data);

    } // End of buidMenu

    
    /**
     * Calculates the menu's offset from the top of the view.
     *
     * @param html menu - the gfu menu
     */
    function _getCurrentOffset_(menu)
    {
        var offset = $(menu).css('top');

        // Parse the css to get a proper number 
        if( offset == 'auto' )
        {
            offset = 0;
        }
        else
        {
            offset = offset.substring(0, offset.length - 2)
            offset = parseInt(offset, 10);
        }

        return offset;

    } // End of _getCurrentOffset_



    /**
     * Controls the state of the scroll buttons.  
     *
     * Make sure the up and down arrows only show when it makes sense to
     * scroll.
     *
     * @param integer newTop - The current offset of the menu from the top
     * @param object data - Reference to the main data object that controls plug-in state
     */
    function _updateButtonState_(newTop, data)
    {
        // Control up button state
        if( newTop >= 0 //Add the top of the menu
            || $(data.menu).height() < $(data.view).height() //Menu is to sort to be scrolled
          ) 
        {
            $(data.up).hide();
        }
        else
        {
            $(data.up).show();
        }
        
        // Control down button state
        if( newTop <= ( $(data.menu).height() - $(data.view).height() ) * -1 )
        {   
            //Hide if only the last window of the view is visible
            $(data.down).hide();
        }
        else
        {
            $(data.down).show();
        }

    } // End of _updateButtonState_


        
    /*********************************
     * Public Methods
     *********************************/


    /**
     * Public scroll function
     *
     * Moves the gfu menu inside the view (the holder)
     *
     * @param integer distance - Number of pixels to scroll
     * @param enum direction - Direction to scroll either 'up' or 'down' 
     */
    function _scroll_(distance, direction)
    {
        var move = true;  // Wither to scroll
        var newTop = -1; // Position to scroll to
        var data = $(this).data('gfuMenu').data // Reference to plug-in data
        var currentTop = _getCurrentOffset_(data.menu); // Get the current offset of the menu
                
        debug("Top of scroll function");
        
        
        // Are these needed? 
        if( $(data.menu).height() < $(data.view).height() ){ move = false }
        if( currentTop < ( $(data.view).height() - $(data.menu).height() )  && direction == 'down' ){ move = false }
        if( currentTop == 0 && direction == 'up' && direction == 'down' ){ move = false }

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
        
        _updateButtonState_(newTop, data);

        
        
        debug( newTop );
        debug( currentTop );
    
    } // End of _scroll_


    /************************************
     * Event handlers
     ************************************/


    /* Event for when a subMenu is clicked
     *
     * @param event - dom event object
     */
    function _subMenuClick_(event)
    {   

        var subMenu = [];
        var real = $(this).data('gfuMenu').real; // The corresponding list element
        var data = $(this).data('gfuMenu').data; // Plug-in's data store

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

    } // end of _subMenuClick_



    /**
     * Called when normal list item is clicked.  Normal means that it does not
     * contain a submenu.
     *
     * @param event special DOM event for clicked element
     */ 
    function _itemClick_(event)
    {
 
        var real = $(this).data('gfuMenu').real; // The corresponding list element
        var data = $(this).data('gfuMenu').data; // Plug-in's data store
        
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
    
    
    /**
     * Called with the title is clicked.
     *
     * If we are not on the root view, the parent menu view is built.
     *
     * @param event - DOM event object
     */ 
    function _buildMenuFromTitle_(event)
    {
        var data = $(this).data('gfuMenu').data;
         
        if( data.nav.length > 0 ) // If we are not a root
        {
            var prev = data.nav.pop(); // get the parent menu
            debug( prev );

            _buildMenu_.apply(data.realMenu, [prev.menu, prev.title]);   
        }

    } // End of build menu from title
 

   

    
   
})( jQuery );

