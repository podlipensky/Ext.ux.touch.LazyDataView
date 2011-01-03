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
					store.nextPage();
				}
			},
			
			/*
			 * Once component's size/orientation was changed - recalculate page's size
			 */
			doComponentLayout : function(width, height, isSetSize) {
				this.calcPageSize(width, height);
				Ext.ux.touch.LazyDataView.superclass.doComponentLayout.apply(this, arguments);
			}
		});
Ext.reg('lazydataview', Ext.ux.touch.LazyDataView);