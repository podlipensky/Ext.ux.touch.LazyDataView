/**
 * @author Pavel Podlipensky - http://podlipensky.com
 * @class LazyDataView
 * <p>This is an extension for Ext.DataView which works with Sencha Touch. LazyDataView provide an ability to load and render data as soon as user need it.</p>
 * <p>Sample Usage</p>
 * <pre><code>
	var store = new Ext.data.Store({
	    model: 'Contact',
		currentPage: 0,
	    proxy: {
	        headers: {"Content-Type": "application/json"},
	        type: 'ajax',//lazy loading make sense only with AJAX/JSONP proxies
	        url : 'ContactListService/ContactList.asmx/GetContacts',
	        startParam: 'start',
			limitParam: 'count',
			reader: {
	            type: 'json',
	            root: 'd' //specific for ASP.NET web sevices
	        }
	    }
	});

    new Ext.ux.touch.LazyDataView({
        tpl: '<tpl for="."><div class="contact"><strong>{firstName}</strong> {lastName}</div></tpl>',
        itemSelector: 'div.contact',
        store: store
    });
 * </code></pre>
 */
Ext.namespace('Ext.ux.touch');

Ext.ux.touch.LazyDataView = Ext.extend(Ext.DataView, {
			itemHeight : -1, //height of single item in the view
			pageSize : -1, //amount of visible items in the view at a time 
			//TODO: determine loadBarrier automatically based on the scroll speed
			loadBarrier : .5, // determine percentage of items were scrolled out before next load will be triggered

			initComponent : function() {
				Ext.ux.touch.LazyDataView.superclass.initComponent.call(this);
			},
			
			/*
			 * Setup basic store's props such as @clearOnPageLoad and @pageSize.
			 * Also do first data chunk load.
			 */
			initStore : function() {
				// keep previous pages/records in the store during scrolling
				this.store.clearOnPageLoad = false;
				this.store.pageSize = this.pageSize;
				// TODO: load 1st and 2nd pages in single request
				// request first batch of data from the server
				this.store.load();
				this.store.on('load', function() {
							// pre-load next page to make better user's
							// experience
							this.store.loadPage(2);
						}, this, {
							single : true
						});
			},
			
			/*
			 * Calculate feature item's height, by rendering and measure dummy record height.
			 * Once height defined - dummy field will be deleted. 
			 */
			getItemHeight : function() {
				var el = this.getTargetEl();
				var div = document.createElement('div');
				var model = this.store.getProxy().getModel();
				var data = {};
				Ext.each(model.prototype.fields.items, function(field){
					data[field.name] = '&nbsp;';
				}, this);
				var item = this.tpl.overwrite(div, [data]);
				el.appendChild(item);
				var height = item.offsetHeight;
				Ext.removeNode(item);
				return height;
			},
			
			/*
			 * Calculate page's size based on current @height and itemHeight values
			 * @width and @height represents current control's size
			 */
			calcPageSize: function(width,  height){
				var pageSize = Math.round(height / this.itemHeight);
				//if pageSize changed
				if(pageSize != this.pageSize){
					this.pageSize = pageSize;
					console.log('pageSize', this.pageSize);
					//init store once pageSize calculated
					if (this.store) {
						this.initStore();
					}// otherwise initData should be called once store is binded
				}
			},

			/*
			 * Once control rendered, we're ready to measure item's height and setup scroller's listeners
			 */
			onRender : function() {
				// do not use Ext.DataView.onRender in order to avoid loading indicator
				Ext.DataView.superclass.onRender.apply(this, arguments);
				
				this.itemHeight = this.getItemHeight();
				
				if (Ext.isEmpty(this.scroller)) {
					throw 'Scroller should be persistent';
				}
				//listen for scroll event
				this.scroller.on('scroll', this.onScroll, this);
			},
			
			/**
		     * Refreshes the view by reloading the data from the store and re-rendering the template.
		     */
		    refresh: function() {
		        if (!this.rendered) {
		            return;
		        }
		        var startIdx  = this.prevRowsCount || 0;
		        var el = this.getTargetEl(),
		            records = this.store.getRange(startIdx);
		     
		        if (records.length < 1) {
		            if (!this.deferEmptyText || this.hasSkippedEmptyText) {
		                el.update(this.emptyText);
		            }
		            this.all.clear();
		        } else {
		            if(this.prevRowsCount){
		            	//append only records from newly loaded page
		            	var appendRecords = this.collectData(records, startIdx);
		            	this.tpl.append(el, appendRecords);
		            	this.prevRowsCount = 0;
		            	this.all.clear();
		            }
		            else{//this is first refresh or not scroll-related refresh
			            el.update('');
			            this.tpl.overwrite(el, this.collectData(records, 0));
		            }
		            //refresh internal collections
		            var elements = Ext.query(this.itemSelector, el.dom);
		            this.all.fill(elements);
		            this.updateIndexes(0);
		        }
		        this.hasSkippedEmptyText = true;
		        this.fireEvent('refresh');
		    },
		    
		    // private
		    onBeforeLoad: Ext.emptyFn,
			
			/*
			 * Triggered during control's items scroll. Determine when to load next page and
			 * the number of the page to load.
			 * @scroller - current scroller we do have
			 * @offset - determine how many pixels were scrolled in each direction
			 */
			onScroll : function(scroller, offset) {
				var store = this.store;
				var pageSize = this.pageSize;
				var oy = offset.y;
				var itemsCount = oy / this.itemHeight;
				// how many items were scrolled on current page
				var c = itemsCount % pageSize;
				var isLastPage = (itemsCount / pageSize) >= (store.currentPage - 2);
				if (c / pageSize >= this.loadBarrier && !store.isLoading()
						&& isLastPage) {
					//cache current amount of records in order to be able to sort out coming records
					this.prevRowsCount = this.store.getCount();
					store.nextPage();
				}
			},
			
			/*
			 * Once component's size/orientation was changed - recalculate page's size
			 */
			doComponentLayout : function(width, height, isSetSize) {
				this.calcPageSize(width, height);
				Ext.ux.touch.LazyDataView.superclass.doComponentLayout.apply(this, arguments);
			},
			
		    getSelectionModel: function(){
		        if (!this.selModel) {
		            this.selModel = {};
		        }
		
		        var mode;
		        switch(true) {
		            case this.simpleSelect:
		                mode = 'SIMPLE';
		            break;
		            
		            case this.multiSelect:
		                mode = 'MULTI';
		            break;
		            
		            case this.singleSelect:
		            default:
		                mode = 'SINGLE';
		            break;
		        }
		        
		        Ext.applyIf(this.selModel, {
		            allowDeselect: this.allowDeselect,
		            mode: mode
		        });        
		        
		        if (!this.selModel.events) {
		            this.selModel = new Ext.ux.touch.LazyDataViewSelectionModel(this.selModel);
		        }
		        
		        if (!this.selModel.hasRelaySetup) {
		            this.relayEvents(this.selModel, ['selectionchange', 'select', 'deselect']);
		            this.selModel.hasRelaySetup = true;
		        }
		
		        // lock the selection model if user
		        // has disabled selection
		        if (this.disableSelection) {
		            this.selModel.locked = true;
		        }
		        
		        return this.selModel;
		    }
		    
		});
Ext.reg('lazydataview', Ext.ux.touch.LazyDataView);