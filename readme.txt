Ext.ux.touch.LazyDataView

This is an extension for Ext.DataView which works with Sencha Touch. 
LazyDataView provide an ability to load and render data as soon as user need it.

Usage

LazyDataView can be used in the way similar to native Senach Touch's Ext.DataView. Although it
make sense to use the control only with async and server-related stores. Also LazyDataView requires
the store and proxy with defined paging-related properties:
new Ext.data.Store({
			currentPage: 0,
			...
			proxy: {
				startParam: 'start',
    			limitParam: 'count',
    			...
			}
})

Example


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
        store: store,
        tpl: '<tpl for="."><div class="contact"><strong>{firstName}</strong> {lastName}</div></tpl>',
        autoHeight:true,
        multiSelect: true,
        overClass:'x-view-over',
        itemSelector:'div.contact',
        emptyText: 'No contacts to display'
})

Folder example contains simple ASP.NET Web Service as a data provider and html/javascript source code for sample contact list app.