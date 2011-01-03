Ext.setup({
    tabletStartupScreen: 'tablet_startup.png',
    phoneStartupScreen: 'phone_startup.png',
    icon: 'icon.png',
    glossOnIcon: false,
    onReady : function() {
        Ext.regModel('Contact', {
            fields: ['firstName', 'lastName']
        });
        		
		//The Store contains the AjaxProxy as an inline configuration
		//ServerProxy.js line 222, handle start = 0 case
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

        var groupingBase = new Ext.ux.touch.LazyDataView({
            tpl: '<tpl for="."><div class="contact"><strong>{firstName}</strong> {lastName}</div></tpl>',
            itemSelector: 'div.contact',
            store: store
        });
        

        if (!Ext.is.Phone) {
            var pnl = new Ext.Panel({
                floating: true,
                width: 350,
                height: 370,
                centered: true,
                modal: true,
                hideOnMaskTap: false,
                layout: 'fit',
                items: [groupingBase]
            });
            pnl.show();
        }
        else {
            new Ext.DataView(Ext.apply(groupingBase, {
                fullscreen: true
            }));
        }
    }
});
